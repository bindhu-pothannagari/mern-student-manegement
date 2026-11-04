import { Router } from "express";
import {
  listInstructors,
  instructorOptions,
  getInstructor,
  createInstructor,
  updateInstructor,
  deleteInstructor,
} from "../controllers/instructorController.js";
import authorize from "../middleware/authorize.js";
import validateObjectId from "../middleware/validateObjectId.js";
import validate from "../middleware/validate.js";
import { instructorCreate, instructorUpdate } from "../validation/schemas.js";

const router = Router();

router.get("/", authorize("instructors:read"), listInstructors);
router.get("/options", authorize("instructors:read"), instructorOptions);
router.get("/:id", authorize("instructors:read"), validateObjectId, getInstructor);
router.post("/", authorize("instructors:manage"), validate(instructorCreate), createInstructor);
router.patch(
  "/:id",
  authorize("instructors:manage"),
  validateObjectId,
  validate(instructorUpdate),
  updateInstructor
);
router.delete("/:id", authorize("instructors:manage"), validateObjectId, deleteInstructor);

export default router;
