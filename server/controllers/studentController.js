import Student from "../models/Student.js";
import AppError from "../utils/AppError.js";

const ALLOWED_FIELDS = ["fullName", "email", "mobile", "gender", "course", "address"];

// Copy only the allowed fields, so extra fields like "role" are ignored
function pickAllowed(body = {}) {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "string") {
      throw new AppError(`${key} must be text`, 400);
    }
    data[key] = body[key];
  }
  return data;
}

export async function getStudents(req, res) {
  const students = await Student.find().sort({ createdAt: -1 });
  res.json({ success: true, count: students.length, data: students });
}

export async function getStudent(req, res) {
  const student = await Student.findById(req.params.id);
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, data: student });
}

export async function createStudent(req, res) {
  const student = await Student.create(pickAllowed(req.body));
  res.status(201).json({ success: true, data: student });
}

export async function updateStudent(req, res) {
  const updates = pickAllowed(req.body);
  if (Object.keys(updates).length === 0) {
    throw new AppError("No valid fields to update", 400);
  }
  const student = await Student.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, data: student });
}

export async function deleteStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, message: "Student deleted" });
}