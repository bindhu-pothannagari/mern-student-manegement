import AppError from "../utils/AppError.js";
import { hasPermission } from "../config/permissions.js";

export default function authorize(permission) {
  return (req, res, next) => {
    if (!req.user) throw new AppError("Authentication required", 401);
    if (!hasPermission(req.user.role, permission)) {
      throw new AppError("You do not have permission to perform this action", 403);
    }
    next();
  };
}