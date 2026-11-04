import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import authorize from "../middleware/authorize.js";

const router = Router();

router.get("/", authorize("reports:read"), getDashboard);

export default router;
