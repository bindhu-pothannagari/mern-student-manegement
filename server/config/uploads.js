import path from "path";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

export const TYPE_INFO = {
  "image/jpeg": { ext: "jpg", extensions: ["jpg", "jpeg"] },
  "image/png": { ext: "png", extensions: ["png"] },
  "image/webp": { ext: "webp", extensions: ["webp"] },
  "application/pdf": { ext: "pdf", extensions: ["pdf"] },
};

export const PHOTO_RULES = {
  label: "Photo",
  maxBytes: 2 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp"],
};

export const DOCUMENT_RULES = {
  label: "Document",
  maxBytes: 5 * 1024 * 1024,
  types: ["application/pdf", "image/jpeg", "image/png"],
};

export const MAX_DOCUMENTS_PER_STUDENT = 20;