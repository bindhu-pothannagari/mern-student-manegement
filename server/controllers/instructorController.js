import mongoose from "mongoose";
import Instructor from "../models/Instructor.js";
import Course from "../models/Course.js";
import AppError from "../utils/AppError.js";
import { escapeRegex, readString, readPaging, pageResponse } from "../utils/queryParams.js";

const FIELDS = ["fullName", "email", "specialization"];

function pickFields(body = {}) {
  const data = {};
  for (const key of FIELDS) {
    if (body[key] === undefined) continue;
    if (typeof body[key] !== "string") throw new AppError(`${key} must be text`, 400);
    data[key] = body[key];
  }
  return data;
}

async function courseCounts(ids) {
  const rows = await Course.aggregate([
    { $match: { instructor: { $in: ids } } },
    { $group: { _id: "$instructor", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

export async function listInstructors(req, res) {
  const search = readString(req.query.search, "search");
  const { page, limit, skip } = readPaging(req.query);

  const filter = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ fullName: pattern }, { email: pattern }, { specialization: pattern }];
  }

  const [total, instructors] = await Promise.all([
    Instructor.countDocuments(filter),
    Instructor.find(filter)
      .collation({ locale: "en" })
      .sort({ fullName: 1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const counts = await courseCounts(instructors.map((i) => i._id));
  const data = instructors.map((i) => ({ ...i, courseCount: counts.get(String(i._id)) ?? 0 }));
  res.json(pageResponse(data, total, page, limit));
}

export async function instructorOptions(req, res) {
  const data = await Instructor.find()
    .select("fullName specialization")
    .collation({ locale: "en" })
    .sort({ fullName: 1 })
    .lean();
  res.json({ success: true, data });
}

export async function getInstructor(req, res) {
  const instructor = await Instructor.findById(req.params.id).lean();
  if (!instructor) throw new AppError("Instructor not found", 404);
  const courses = await Course.find({ instructor: instructor._id })
    .select("name code status")
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, data: { ...instructor, courses } });
}

export async function createInstructor(req, res) {
  const instructor = await Instructor.create(pickFields(req.body));
  res.status(201).json({ success: true, data: instructor });
}

export async function updateInstructor(req, res) {
  const updates = pickFields(req.body);
  if (Object.keys(updates).length === 0) throw new AppError("No valid fields to update", 400);
  const instructor = await Instructor.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!instructor) throw new AppError("Instructor not found", 404);
  res.json({ success: true, data: instructor });
}

export async function deleteInstructor(req, res) {
  const instructor = await Instructor.findByIdAndDelete(req.params.id);
  if (!instructor) throw new AppError("Instructor not found", 404);
  const result = await Course.updateMany(
    { instructor: new mongoose.Types.ObjectId(req.params.id) },
    { $set: { instructor: null } }
  );
  res.json({
    success: true,
    message: `Instructor deleted. ${result.modifiedCount} course(s) are now unassigned.`,
  });
}