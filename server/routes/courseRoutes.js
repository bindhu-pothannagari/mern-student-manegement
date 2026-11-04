import { Router } from "express";
import {
  listCourses,
  courseOptions,
  getCourse,
  getCourseStudents,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import authorize from "../middleware/authorize.js";
import validateObjectId from "../middleware/validateObjectId.js";
import validate from "../middleware/validate.js";
import { courseCreate, courseUpdate } from "../validation/schemas.js";

const router = Router();

router.get("/", authorize("courses:read"), listCourses);
router.get("/options", authorize("courses:read"), courseOptions);
router.get("/:id", authorize("courses:read"), validateObjectId, getCourse);
router.get(
  "/:id/students",
  authorize("courses:read"),
  authorize("students:read"),
  validateObjectId,
  getCourseStudents
);
router.post("/", authorize("courses:manage"), validate(courseCreate), createCourse);
router.patch("/:id", authorize("courses:manage"), validateObjectId, validate(courseUpdate), updateCourse);
router.delete("/:id", authorize("courses:manage"), validateObjectId, deleteCourse);

export default router;
