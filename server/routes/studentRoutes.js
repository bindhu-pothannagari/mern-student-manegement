import { Router } from "express";
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import {
  uploadPhoto,
  getPhoto,
  removePhoto,
  listDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument,
} from "../controllers/studentFileController.js";
import validateObjectId from "../middleware/validateObjectId.js";
import authorize from "../middleware/authorize.js";
import { photoUpload, documentUpload } from "../middleware/upload.js";

const router = Router();

router
  .route("/")
  .get(authorize("students:read"), getStudents)
  .post(authorize("students:create"), createStudent);

router
  .route("/:id")
  .get(authorize("students:read"), validateObjectId, getStudent)
  .patch(authorize("students:update"), validateObjectId, updateStudent)
  .delete(authorize("students:delete"), validateObjectId, deleteStudent);

router
  .route("/:id/photo")
  .get(authorize("students:read"), validateObjectId, getPhoto)
  .put(authorize("students:update"), validateObjectId, photoUpload, uploadPhoto)
  .delete(authorize("students:update"), validateObjectId, removePhoto);

router
  .route("/:id/documents")
  .get(authorize("documents:read"), validateObjectId, listDocuments)
  .post(authorize("documents:manage"), validateObjectId, documentUpload, uploadDocument);

router.get(
  "/:id/documents/:docId/download",
  authorize("documents:read"),
  validateObjectId,
  downloadDocument
);
router.delete("/:id/documents/:docId", authorize("documents:delete"), validateObjectId, deleteDocument);

export default router;