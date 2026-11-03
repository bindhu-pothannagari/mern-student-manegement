import User, { ROLES } from "../models/User.js";
import AppError from "../utils/AppError.js";

const PAGE_SIZES = [10, 25, 50];

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readString(value, name, maxLength = 100) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new AppError(`${name} must be a single text value`, 400);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new AppError(`${name} is too long`, 400);
  return trimmed;
}

function readInt(value, name, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AppError(`${name} must be a whole number`, 400);
  }
  return Number(value);
}

async function assertNotLastAdmin(target) {
  if (target.role !== "admin") return;
  const admins = await User.countDocuments({ role: "admin" });
  if (admins <= 1) throw new AppError("At least one admin account is required", 409);
}

export async function listUsers(req, res) {
  const search = readString(req.query.search, "search");
  const role = readString(req.query.role, "role");
  const page = readInt(req.query.page, "page", 1);
  const limit = readInt(req.query.limit, "limit", 10);

  if (page < 1) throw new AppError("page must be 1 or more", 400);
  if (!PAGE_SIZES.includes(limit)) throw new AppError("limit must be 10, 25 or 50", 400);
  if (role && !ROLES.includes(role)) throw new AppError("Invalid role filter", 400);

  const filter = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ username: pattern }, { email: pattern }];
  }
  if (role) filter.role = role;

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({
    success: true,
    count: users.length,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    data: users,
  });
}

export async function updateUserRole(req, res) {
  const role = req.body?.role;
  if (typeof role !== "string" || !ROLES.includes(role)) {
    throw new AppError(`role must be one of: ${ROLES.join(", ")}`, 400);
  }
  if (req.user._id.equals(req.params.id)) {
    throw new AppError("You cannot change your own role", 403);
  }

  const target = await User.findById(req.params.id);
  if (!target) throw new AppError("User not found", 404);
  if (target.role === role) return res.json({ success: true, data: target });
  if (role !== "admin") await assertNotLastAdmin(target);

  const updated = await User.findByIdAndUpdate(
    target._id,
    { role, $inc: { tokenVersion: 1 } },
    { returnDocument: "after" }
  );
  res.json({ success: true, data: updated });
}

export async function deleteUser(req, res) {
  if (req.user._id.equals(req.params.id)) {
    throw new AppError("You cannot delete your own account here", 403);
  }

  const target = await User.findById(req.params.id);
  if (!target) throw new AppError("User not found", 404);
  await assertNotLastAdmin(target);

  await target.deleteOne();
  res.json({ success: true, message: "User deleted" });
}