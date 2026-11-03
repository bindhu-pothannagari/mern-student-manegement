import mongoose from "mongoose";

const studentDocumentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    key: { type: String, required: true, select: false },
    originalName: { type: String, required: true, maxlength: 100 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

studentDocumentSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("StudentDocument", studentDocumentSchema);