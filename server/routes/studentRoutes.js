import { Router } from "express";
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import validateObjectId from "../middleware/validateObjectId.js";
import authorize from "../middleware/authorize.js";

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

export default router;