import { Router } from "express";
import { listUsers, updateUserRole, deleteUser } from "../controllers/userController.js";
import authorize from "../middleware/authorize.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = Router();

router.use(authorize("users:manage"));

router.get("/", listUsers);
router.patch("/:id/role", validateObjectId, updateUserRole);
router.delete("/:id", validateObjectId, deleteUser);

export default router;