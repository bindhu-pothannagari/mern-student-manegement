import AppError from "./AppError.js";

export const PAGE_SIZES = [10, 25, 50];

export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function readString(value, name, maxLength = 100) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new AppError(`${name} must be a single text value`, 400);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new AppError(`${name} is too long`, 400);
  return trimmed;
}

export function readInt(value, name, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AppError(`${name} must be a whole number`, 400);
  }
  return Number(value);
}

export function readPaging(query) {
  const page = readInt(query.page, "page", 1);
  const limit = readInt(query.limit, "limit", 10);
  if (page < 1) throw new AppError("page must be 1 or more", 400);
  if (!PAGE_SIZES.includes(limit)) throw new AppError("limit must be 10, 25 or 50", 400);
  return { page, limit, skip: (page - 1) * limit };
}

export function pageResponse(data, total, page, limit) {
  return {
    success: true,
    count: data.length,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    data,
  };
}