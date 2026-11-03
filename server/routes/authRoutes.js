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
import { authLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, updateMe);
router.patch("/password", requireAuth, changePassword);

export default router;