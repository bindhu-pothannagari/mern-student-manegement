import mongoose from "mongoose";

export const COURSE_STATUSES = ["active", "inactive"];

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      minlength: [2, "Course name must be at least 2 characters"],
      maxlength: [100, "Course name must be at most 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Course code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9-]{2,12}$/, "Code must be 2–12 letters, numbers or hyphens"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description must be at most 1000 characters"],
      default: "",
    },
    durationMonths: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 month"],
      max: [120, "Duration must be at most 120 months"],
      validate: { validator: Number.isInteger, message: "Duration must be a whole number of months" },
    },
    fee: {
      type: Number,
      required: [true, "Fee is required"],
      min: [0, "Fee cannot be negative"],
    },
    status: {
      type: String,
      enum: { values: COURSE_STATUSES, message: "Status must be active or inactive" },
      default: "active",
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Instructor",
      default: null,
    },
  },
  { timestamps: true }
);

courseSchema.index({ name: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ instructor: 1 });

export default mongoose.model("Course", courseSchema);