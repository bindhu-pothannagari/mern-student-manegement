import { Router } from "express";
import { publicCourses } from "../controllers/courseController.js";

const router = Router();

router.get("/courses", publicCourses);

export default router;
