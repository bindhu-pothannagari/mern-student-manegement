import path from "path";
import AppError from "./AppError.js";
import { TYPE_INFO } from "../config/uploads.js";

function detectMimeType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

function safeOriginalName(name) {
  const base = path.basename(String(name || "")).replace(/[^\w.\- ]+/g, "_").trim();
  return (base || "file").slice(-100);
}

export function validateUpload(file, rules) {
  if (!file) throw new AppError("Choose a file to upload", 400);

  const allowed = rules.types.map((t) => TYPE_INFO[t].ext.toUpperCase()).join(", ");
  const mimeType = detectMimeType(file.buffer);
  if (!mimeType || !rules.types.includes(mimeType)) {
    throw new AppError(`${rules.label} must be one of: ${allowed}`, 400);
  }

  const ext = path.extname(file.originalname || "").slice(1).toLowerCase();
  if (!TYPE_INFO[mimeType].extensions.includes(ext)) {
    throw new AppError("The file extension does not match the file's content", 400);
  }

  return {
    mimeType,
    ext: TYPE_INFO[mimeType].ext,
    size: file.size,
    originalName: safeOriginalName(file.originalname),
  };
}