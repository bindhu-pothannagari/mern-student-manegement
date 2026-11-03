import multer from "multer";
import { PHOTO_RULES, DOCUMENT_RULES } from "../config/uploads.js";

function singleFile(rules) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: rules.maxBytes, files: 1, fields: 5 },
  }).single("file");
}

export const photoUpload = singleFile(PHOTO_RULES);
export const documentUpload = singleFile(DOCUMENT_RULES);