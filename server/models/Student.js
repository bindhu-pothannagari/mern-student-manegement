import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    originalName: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const enrollmentEmailSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["pending", "sending", "sent", "failed"], default: "pending" },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date },
    messageId: { type: String },
    lastError: { type: String },
  },
  { _id: false }
);

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
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    address: { type: String, required: [true, "Address is required"], trim: true, minlength: 10 },
    photo: { type: photoSchema, default: null },
    enrollmentEmail: { type: enrollmentEmailSchema, default: () => ({}) },
  },
  { timestamps: true }
);

studentSchema.index({ createdAt: -1 });
studentSchema.index({ fullName: 1 });
studentSchema.index({ course: 1 });

studentSchema.set("toJSON", {
  transform(doc, ret) {
    if (ret.photo) {
      ret.photo = { mimeType: ret.photo.mimeType, size: ret.photo.size, uploadedAt: ret.photo.uploadedAt };
    }
    if (ret.enrollmentEmail) {
      ret.enrollmentEmail = { status: ret.enrollmentEmail.status, sentAt: ret.enrollmentEmail.sentAt, attempts: ret.enrollmentEmail.attempts };
    }
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Student", studentSchema);