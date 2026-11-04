import mongoose from "mongoose";
import Course, { COURSE_STATUSES } from "../models/Course.js";
import Instructor from "../models/Instructor.js";
import Student from "../models/Student.js";
import AppError from "../utils/AppError.js";
import { studentProjection } from "../config/permissions.js";
import { escapeRegex, readString, readPaging, pageResponse } from "../utils/queryParams.js";

const TEXT_FIELDS = ["name", "code", "description", "status"];
const NUMBER_FIELDS = ["durationMonths", "fee"];

async function pickFields(body = {}) {
  const data = {};
  for (const key of TEXT_FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "string") throw new AppError(`${key} must be text`, 400);
    data[key] = body[key];
  }
  for (const key of NUMBER_FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "number" || !Number.isFinite(body[key])) {
      throw new AppError(`${key} must be a number`, 400);
    }
    data[key] = body[key];
  }
  if (body.instructor !== undefined) {
    if (body.instructor === null || body.instructor === "") {
      data.instructor = null;
    } else {
      if (typeof body.instructor !== "string" || !/^[a-f\d]{24}$/i.test(body.instructor)) {
        throw new AppError("instructor must be a valid instructor ID", 400);
      }
      if (!(await Instructor.exists({ _id: body.instructor }))) {
        throw new AppError("Selected instructor does not exist", 400);
      }
      data.instructor = body.instructor;
    }
  }
  return data;
}

async function studentCounts(ids) {
  const rows = await Student.aggregate([
    { $match: { course: { $in: ids } } },
    { $group: { _id: "$course", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

export async function listCourses(req, res) {
  const search = readString(req.query.search, "search");
  const status = readString(req.query.status, "status");
  const { page, limit, skip } = readPaging(req.query);
  if (status && !COURSE_STATUSES.includes(status)) throw new AppError("Invalid status filter", 400);

  const filter = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { code: pattern }];
  }
  if (status) filter.status = status;

  const [total, courses] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .populate("instructor", "fullName")
      .collation({ locale: "en" })
      .sort({ name: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const counts = await studentCounts(courses.map((c) => c._id));
  const data = courses.map((c) => ({ ...c, studentCount: counts.get(String(c._id)) ?? 0 }));
  res.json(pageResponse(data, total, page, limit));
}

export async function courseOptions(req, res) {
  const data = await Course.find()
    .select("name code status")
    .collation({ locale: "en" })
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, data });
}

export async function getCourse(req, res) {
  const course = await Course.findById(req.params.id)
    .populate("instructor", "fullName email specialization")
    .lean();
  if (!course) throw new AppError("Course not found", 404);
  const studentCount = await Student.countDocuments({ course: course._id });
  res.json({ success: true, data: { ...course, studentCount } });
}

export async function getCourseStudents(req, res) {
  const { page, limit, skip } = readPaging(req.query);
  if (!(await Course.exists({ _id: req.params.id }))) throw new AppError("Course not found", 404);

  const filter = { course: new mongoose.Types.ObjectId(req.params.id) };
  const [total, students] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .select(studentProjection(req.user.role))
      .collation({ locale: "en" })
      .sort({ fullName: 1, _id: 1 })
      .skip(skip)
      .limit(limit),
  ]);
  res.json(pageResponse(students, total, page, limit));
}

export async function createCourse(req, res) {
  const course = await Course.create(await pickFields(req.body));
  res.status(201).json({ success: true, data: course });
}

export async function updateCourse(req, res) {
  const updates = await pickFields(req.body);
  if (Object.keys(updates).length === 0) throw new AppError("No valid fields to update", 400);
  const course = await Course.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  }).populate("instructor", "fullName email specialization");
  if (!course) throw new AppError("Course not found", 404);
  res.json({ success: true, data: course });
}

export async function deleteCourse(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError("Course not found", 404);

  const enrolled = await Student.countDocuments({ course: course._id });
  if (enrolled > 0) {
    throw new AppError(
      `This course has ${enrolled} enrolled student(s). Set it to inactive instead of deleting it.`,
      409
    );
  }

  await course.deleteOne();
  res.json({ success: true, message: "Course deleted" });
}

export async function publicCourses(req, res) {
  const data = await Course.find({ status: "active" })
    .select("name code description durationMonths fee")
    .collation({ locale: "en" })
    .sort({ name: 1 })
    .limit(50)
    .lean();
  res.set("Cache-Control", "public, max-age=300");
  res.json({ success: true, data });
}