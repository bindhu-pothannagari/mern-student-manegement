import Student from "../models/Student.js";
import AppError from "../utils/AppError.js";
import {
  STUDENT_FIELDS,
  EDITABLE_STUDENT_FIELDS,
  studentProjection,
} from "../config/permissions.js";

const PAGE_SIZES = [10, 25, 50];
const SORT_FIELDS = { name: "fullName", createdAt: "createdAt" };
const GENDERS = ["male", "female", "other"];

function pickFields(body = {}, allowed) {
  const data = {};
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "string") {
      throw new AppError(`${key} must be text`, 400);
    }
    data[key] = body[key];
  }
  return data;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readString(value, name, maxLength = 100) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new AppError(`${name} must be a single text value`, 400);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) throw new AppError(`${name} is too long`, 400);
  return trimmed;
}

function readInt(value, name, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new AppError(`${name} must be a whole number`, 400);
  }
  return Number(value);
}

export async function getStudents(req, res) {
  const search = readString(req.query.search, "search");
  const course = readString(req.query.course, "course");
  const gender = readString(req.query.gender, "gender");
  const sortKey = readString(req.query.sort, "sort") || "createdAt";
  const order =
    readString(req.query.order, "order") || (sortKey === "name" ? "asc" : "desc");
  const page = readInt(req.query.page, "page", 1);
  const limit = readInt(req.query.limit, "limit", 10);

  if (page < 1) throw new AppError("page must be 1 or more", 400);
  if (!PAGE_SIZES.includes(limit)) throw new AppError("limit must be 10, 25 or 50", 400);
  if (gender && !GENDERS.includes(gender)) throw new AppError("Invalid gender filter", 400);
  if (!SORT_FIELDS[sortKey]) throw new AppError("sort must be name or createdAt", 400);
  if (!["asc", "desc"].includes(order)) throw new AppError("order must be asc or desc", 400);

  const filter = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ fullName: pattern }, { email: pattern }];
  }
  if (course) filter.course = course;
  if (gender) filter.gender = gender;

  const direction = order === "asc" ? 1 : -1;

  const [total, students] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .select(studentProjection(req.user.role))
      .collation({ locale: "en" })
      .sort({ [SORT_FIELDS[sortKey]]: direction, _id: direction })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  res.json({
    success: true,
    count: students.length,
    total,
    page,
    limit,
    totalPages,
    data: students,
  });
}

export async function getStudent(req, res) {
  const student = await Student.findById(req.params.id).select(studentProjection(req.user.role));
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, data: student });
}

export async function createStudent(req, res) {
  const student = await Student.create(pickFields(req.body, STUDENT_FIELDS));
  res.status(201).json({ success: true, data: student });
}

export async function updateStudent(req, res) {
  const allowed = EDITABLE_STUDENT_FIELDS[req.user.role] ?? [];
  const blocked = STUDENT_FIELDS.filter(
    (key) => !allowed.includes(key) && req.body?.[key] !== undefined
  );
  if (blocked.length > 0) {
    throw new AppError(`You are not allowed to change: ${blocked.join(", ")}`, 403);
  }

  const updates = pickFields(req.body, allowed);
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