import AppError from "../utils/AppError.js";

export default function validateObjectId(req, res, next) {
  if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
    return next(new AppError("Invalid student ID", 400));
  }
  next();
}