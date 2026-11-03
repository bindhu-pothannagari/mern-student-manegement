import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  createResetToken,
  hashToken,
} from "../utils/tokens.js";

const RESET_TTL_MS = 15 * 60 * 1000;
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

function readText(body, field, { required = true, trim = true } = {}) {
  const value = body?.[field];
  if (value === undefined || value === null || value === "") {
    if (required) throw new AppError(`${field} is required`, 400);
    return undefined;
  }
  if (typeof value !== "string") throw new AppError(`${field} must be text`, 400);
  return trim ? value.trim() : value;
}

function checkNewPassword(password) {
  if (password.length < 8 || password.length > 72) {
    throw new AppError("Password must be 8 to 72 characters", 400);
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError("Password must contain at least one letter and one number", 400);
  }
}

async function saveUser(user) {
  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "value";
      throw new AppError(`This ${field} is already registered`, 409);
    }
    throw err;
  }
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
}

function sendAuth(res, user, status = 200) {
  res.cookie(REFRESH_COOKIE, signRefreshToken(user), refreshCookieOptions());
  res.status(status).json({ success: true, accessToken: signAccessToken(user), data: user });
}

export async function register(req, res) {
  const username = readText(req.body, "username").toLowerCase();
  const email = readText(req.body, "email").toLowerCase();
  const password = readText(req.body, "password", { trim: false });
  checkNewPassword(password);

  const existing = await User.findOne({ $or: [{ email }, { username }] }).select("email username");
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    throw new AppError(`This ${field} is already registered`, 409);
  }

  const user = new User({ username, email, password });
  await saveUser(user);
  sendAuth(res, user, 201);
}

export async function login(req, res) {
  const email = readText(req.body, "email").toLowerCase();
  const password = readText(req.body, "password", { trim: false });

  const user = await User.findOne({ email }).select("+password +tokenVersion");
  const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !ok) throw new AppError("Invalid email or password", 401);

  sendAuth(res, user);
}

export async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) return res.status(204).end();

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw new AppError("Session expired. Please log in again", 401);
  }

  const user = await User.findById(payload.sub).select("+tokenVersion");
  if (!user || user.tokenVersion !== payload.tv) {
    clearRefreshCookie(res);
    throw new AppError("Session is no longer valid. Please log in again", 401);
  }

  sendAuth(res, user);
}

export async function logout(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await User.updateOne(
        { _id: payload.sub, tokenVersion: payload.tv },
        { $inc: { tokenVersion: 1 } }
      );
    } catch {
      // an invalid or expired cookie needs no server-side change
    }
  }
  clearRefreshCookie(res);
  res.json({ success: true, message: "Logged out" });
}

export async function getMe(req, res) {
  res.json({ success: true, data: req.user });
}

export async function updateMe(req, res) {
  if (req.body?.role !== undefined || req.body?.password !== undefined) {
    throw new AppError("Role and password cannot be changed here", 400);
  }
  const username = readText(req.body, "username", { required: false });
  const email = readText(req.body, "email", { required: false });
  if (!username && !email) throw new AppError("Nothing to update", 400);

  const user = req.user;
  if (username) user.username = username.toLowerCase();
  if (email) user.email = email.toLowerCase();
  await saveUser(user);
  res.json({ success: true, data: user });
}

export async function changePassword(req, res) {
  const currentPassword = readText(req.body, "currentPassword", { trim: false });
  const newPassword = readText(req.body, "newPassword", { trim: false });
  checkNewPassword(newPassword);

  const user = await User.findById(req.user._id).select("+password +tokenVersion");
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect", 400);
  }
  if (await user.comparePassword(newPassword)) {
    throw new AppError("New password must be different from the current one", 400);
  }

  user.password = newPassword;
  user.tokenVersion += 1;
  await saveUser(user);
  sendAuth(res, user);
}

export async function forgotPassword(req, res) {
  const email = readText(req.body, "email").toLowerCase();
  const user = await User.findOne({ email });

  if (user) {
    const { token, hash } = createResetToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save({ validateBeforeSave: false });
    if (process.env.NODE_ENV !== "production") {
      console.log(`Password reset link (dev only): ${process.env.CLIENT_URL}/reset-password/${token}`);
    }
  }

  res.json({ success: true, message: "If that email is registered, a reset link has been sent" });
}

export async function resetPassword(req, res) {
  const token = readText(req.body, "token");
  const password = readText(req.body, "password", { trim: false });
  checkNewPassword(password);

  if (!/^[a-f0-9]{64}$/.test(token)) {
    throw new AppError("Reset link is invalid or has expired", 400);
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select("+tokenVersion");
  if (!user) throw new AppError("Reset link is invalid or has expired", 400);

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion += 1;
  await saveUser(user);

  res.json({ success: true, message: "Password has been reset. Please log in" });
}