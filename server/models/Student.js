import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, "Full name is required"], trim: true, minlength: 3 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid 10-digit mobile number"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: { values: ["male", "female", "other"], message: "Invalid gender" },
    },
    course: { type: String, required: [true, "Course is required"], trim: true },
    address: { type: String, required: [true, "Address is required"], trim: true, minlength: 10 },
  },
  { timestamps: true }
);

export default mongoose.model("Student", studentSchema);