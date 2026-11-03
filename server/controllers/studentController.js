import mongoose from "mongoose";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import AppError from "../utils/AppError.js";
import {
  STUDENT_FIELDS,
  EDITABLE_STUDENT_FIELDS,
  studentProjection,
} from "../config/permissions.js";
import { escapeRegex, readString, readPaging, pageResponse } from "../utils/queryParams.js";

const SORT_FIELDS = { name: "fullName", createdAt: "createdAt" };
const GENDERS = ["male", "female", "other"];
const COURSE_FIELDS = "name code status";
const OBJECT_ID = /^[a-f\d]{24}$/i;

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

async function checkCourse(courseId, currentCourseId) {
  if (!OBJECT_ID.test(courseId)) {
    throw new AppError("Select a valid course", 400);
  }
  const course = await Course.findById(courseId).select("status");
  if (!course) {
    throw new AppError("Selected course does not exist", 400);
  }
  const unchanged = currentCourseId && String(currentCourseId) === String(courseId);
  if (course.status !== "active" && !unchanged) {
    throw new AppError("Selected course is inactive and not accepting students", 400);
  }
}

export async function getStudents(req, res) {
  const search = readString(req.query.search, "search");
  const course = readString(req.query.course, "course");
  const gender = readString(req.query.gender, "gender");
  const sortKey = readString(req.query.sort, "sort") || "createdAt";
  const order =
    readString(req.query.order, "order") || (sortKey === "name" ? "asc" : "desc");
  const { page, limit, skip } = readPaging(req.query);

  if (course && !OBJECT_ID.test(course)) throw new AppError("course must be a course ID", 400);
  if (gender && !GENDERS.includes(gender)) throw new AppError("Invalid gender filter", 400);
  if (!SORT_FIELDS[sortKey]) throw new AppError("sort must be name or createdAt", 400);
  if (!["asc", "desc"].includes(order)) throw new AppError("order must be asc or desc", 400);

  const filter = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ fullName: pattern }, { email: pattern }];
  }
  if (course) filter.course = new mongoose.Types.ObjectId(course);
  if (gender) filter.gender = gender;

  const direction = order === "asc" ? 1 : -1;

  const [total, students] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .select(studentProjection(req.user.role))
      .populate("course", COURSE_FIELDS)
      .collation({ locale: "en" })
      .sort({ [SORT_FIELDS[sortKey]]: direction, _id: direction })
      .skip(skip)
      .limit(limit),
  ]);

  res.json(pageResponse(students, total, page, limit));
}

export async function getStudent(req, res) {
  const student = await Student.findById(req.params.id)
    .select(studentProjection(req.user.role))
    .populate("course", `${COURSE_FIELDS} durationMonths`);
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, data: student });
}

export async function createStudent(req, res) {
  const data = pickFields(req.body, STUDENT_FIELDS);
  if (!data.course) throw new AppError("Course is required", 400);
  await checkCourse(data.course);

  const student = await Student.create(data);
  await student.populate("course", COURSE_FIELDS);
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

  const existing = await Student.findById(req.params.id).select("course");
  if (!existing) throw new AppError("Student not found", 404);
  if (updates.course !== undefined) await checkCourse(updates.course, existing.course);

  const student = await Student.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  }).populate("course", COURSE_FIELDS);
  res.json({ success: true, data: student });
}

export async function deleteStudent(req, res) {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new AppError("Student not found", 404);
  res.json({ success: true, message: "Student deleted" });
}