import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "../config/uploads.js";

const KEY_PATTERN = /^(photos|documents)\/[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/;

export function resolveKey(key) {
  if (!KEY_PATTERN.test(key)) throw new Error("Invalid storage key");
  return path.join(UPLOAD_DIR, key);
}

export async function saveFile(folder, buffer, ext) {
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  const fullPath = resolveKey(key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, buffer, { flag: "wx" });
  return key;
}

export async function fileExists(key) {
  try {
    await fs.access(resolveKey(key));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(key) {
  if (!key) return;
  try {
    await fs.unlink(resolveKey(key));
  } catch (err) {
    if (err.code !== "ENOENT") console.error(`Could not delete stored file ${key}: ${err.code}`);
  }
}