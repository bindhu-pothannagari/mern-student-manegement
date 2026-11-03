import Student from "../models/Student.js";
import StudentDocument from "../models/StudentDocument.js";
import AppError from "../utils/AppError.js";
import { validateUpload } from "../utils/fileValidation.js";
import { saveFile, deleteFile, fileExists, resolveKey } from "../services/fileStorage.js";
import { PHOTO_RULES, DOCUMENT_RULES, MAX_DOCUMENTS_PER_STUDENT } from "../config/uploads.js";

const OBJECT_ID = /^[a-f\d]{24}$/i;

function setSafeFileHeaders(res) {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Content-Security-Policy", "default-src 'none'; sandbox");
}

async function sendStoredFile(res, key, missingMessage) {
  if (!(await fileExists(key))) throw new AppError(missingMessage, 404);
  setSafeFileHeaders(res);
  res.sendFile(resolveKey(key));
}

export async function uploadPhoto(req, res) {
  const info = validateUpload(req.file, PHOTO_RULES);
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError("Student not found", 404);

  const oldKey = student.photo?.key;
  const newKey = await saveFile("photos", req.file.buffer, info.ext);
  try {
    student.photo = {
      key: newKey,
      mimeType: info.mimeType,
      size: info.size,
      originalName: info.originalName,
      uploadedAt: new Date(),
    };
    await student.save({ validateModifiedOnly: true });
  } catch (err) {
    await deleteFile(newKey);
    throw err;
  }
  await deleteFile(oldKey);

  res.json({ success: true, data: student.toJSON().photo });
}

export async function getPhoto(req, res) {
  const student = await Student.findById(req.params.id).select("photo");
  if (!student) throw new AppError("Student not found", 404);
  if (!student.photo?.key) throw new AppError("This student has no photo", 404);
  res.set("Cache-Control", "private, max-age=300");
  await sendStoredFile(res, student.photo.key, "The photo file is missing");
}

export async function removePhoto(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError("Student not found", 404);
  const key = student.photo?.key;
  if (!key) throw new AppError("This student has no photo", 404);

  student.photo = null;
  await student.save({ validateModifiedOnly: true });
  await deleteFile(key);
  res.json({ success: true, message: "Photo removed" });
}

export async function listDocuments(req, res) {
  if (!(await Student.exists({ _id: req.params.id }))) throw new AppError("Student not found", 404);
  const documents = await StudentDocument.find({ student: req.params.id })
    .populate("uploadedBy", "username")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: documents });
}

export async function uploadDocument(req, res) {
  const info = validateUpload(req.file, DOCUMENT_RULES);
  if (!(await Student.exists({ _id: req.params.id }))) throw new AppError("Student not found", 404);

  const count = await StudentDocument.countDocuments({ student: req.params.id });
  if (count >= MAX_DOCUMENTS_PER_STUDENT) {
    throw new AppError(`A student can have at most ${MAX_DOCUMENTS_PER_STUDENT} documents`, 409);
  }

  const key = await saveFile("documents", req.file.buffer, info.ext);
  let document;
  try {
    document = await StudentDocument.create({
      student: req.params.id,
      key,
      originalName: info.originalName,
      mimeType: info.mimeType,
      size: info.size,
      uploadedBy: req.user._id,
    });
  } catch (err) {
    await deleteFile(key);
    throw err;
  }

  const saved = document.toObject();
  delete saved.key;
  res.status(201).json({ success: true, data: saved });
}

async function findOwnedDocument(req, withKey) {
  if (!OBJECT_ID.test(req.params.docId)) throw new AppError("Invalid ID format", 400);
  const query = StudentDocument.findOne({ _id: req.params.docId, student: req.params.id });
  if (withKey) query.select("+key");
  const document = await query;
  if (!document) throw new AppError("Document not found", 404);
  return document;
}

export async function downloadDocument(req, res) {
  const document = await findOwnedDocument(req, true);
  res.attachment(document.originalName);
  res.type(document.mimeType);
  res.set("Cache-Control", "private, no-store");
  await sendStoredFile(res, document.key, "The document file is missing");
}

export async function deleteDocument(req, res) {
  const document = await findOwnedDocument(req, true);
  await document.deleteOne();
  await deleteFile(document.key);
  res.json({ success: true, message: "Document deleted" });
}