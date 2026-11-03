import crypto from "crypto";
import jwt from "jsonwebtoken";

export const REFRESH_COOKIE = "refreshToken";

function getSecret(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, tv: user.tokenVersion },
    getSecret("JWT_ACCESS_SECRET"),
    { expiresIn: process.env.ACCESS_TOKEN_TTL || "15m" }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tv: user.tokenVersion },
    getSecret("JWT_REFRESH_SECRET"),
    { expiresIn: process.env.REFRESH_TOKEN_TTL || "7d" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getSecret("JWT_ACCESS_SECRET"));
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, getSecret("JWT_REFRESH_SECRET"));
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
}