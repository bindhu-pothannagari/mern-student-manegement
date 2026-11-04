import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import requireAuth from "../middleware/requireAuth.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import * as schemas from "../validation/schemas.js";

const router = Router();

router.post("/register", authLimiter, validate(schemas.register), register);
router.post("/login", authLimiter, validate(schemas.login), login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, validate(schemas.forgotPassword), forgotPassword);
router.post("/reset-password", authLimiter, validate(schemas.resetPassword), resetPassword);

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, validate(schemas.updateMe), updateMe);
router.patch("/password", requireAuth, validate(schemas.changePassword), changePassword);

export default router;
