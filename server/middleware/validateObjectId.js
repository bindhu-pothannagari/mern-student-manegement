import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

export default function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id) || !/^[a-f\d]{24}$/i.test(req.params.id)) {
    throw new AppError("Invalid ID format", 400);
  }
  next();
}