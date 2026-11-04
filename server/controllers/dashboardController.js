import mongoose from "mongoose";
import Student, { ENROLLMENT_STATUSES } from "../models/Student.js";
import Course from "../models/Course.js";
import Instructor from "../models/Instructor.js";
import AppError from "../utils/AppError.js";
import { readString } from "../utils/queryParams.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const OBJECT_ID = /^[a-f\d]{24}$/i;
const OFFSET = /^[+-]\d{2}:\d{2}$/.test(process.env.REPORT_UTC_OFFSET || "")
  ? process.env.REPORT_UTC_OFFSET
  : "+05:30";

function parseDay(value, name, endOfDay) {
  if (!value) return undefined;
  if (!DATE.test(value)) throw new AppError(`${name} must be a date in YYYY-MM-DD format`, 400);
  const time = endOfDay ? "T23:59:59.999" : "T00:00:00.000";
  const date = new Date(`${value}${time}${OFFSET}`);
  if (Number.isNaN(date.getTime())) throw new AppError(`${name} is not a valid date`, 400);
  return date;
}

function monthKeys(first, last) {
  const keys = [];
  let [year, month] = first.split("-").map(Number);
  const [endYear, endMonth] = last.split("-").map(Number);
  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys.slice(-12);
}

export async function getDashboard(req, res) {
  const from = parseDay(readString(req.query.from, "from"), "from", false);
  const to = parseDay(readString(req.query.to, "to"), "to", true);
  const course = readString(req.query.course, "course");

  if (from && to && from > to) throw new AppError("from must be on or before to", 400);
  if (course && !OBJECT_ID.test(course)) throw new AppError("course must be a course ID", 400);

  const match = {};
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = from;
    if (to) match.createdAt.$lte = to;
  }
  if (course) match.course = new mongoose.Types.ObjectId(course);

  const [facets, courses, instructorCount] = await Promise.all([
    Student.aggregate([
      { $match: match },
      {
        $facet: {
          total: [{ $count: "count" }],
          byCourse: [{ $group: { _id: "$course", count: { $sum: 1 } } }],
          byStatus: [
            { $group: { _id: { $ifNull: ["$enrollmentStatus", "active"] }, count: { $sum: 1 } } },
          ],
          monthly: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: OFFSET } },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          recent: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $limit: 5 },
            { $project: { fullName: 1, email: 1, course: 1, enrollmentStatus: 1, createdAt: 1 } },
          ],
        },
      },
    ]),
    Course.find().select("name code status").sort({ name: 1 }).lean(),
    Instructor.countDocuments(),
  ]);

  const result = facets[0];
  const courseMap = new Map(courses.map((c) => [String(c._id), c]));
  const courseCounts = new Map(result.byCourse.map((r) => [String(r._id), r.count]));
  const statusCounts = new Map(result.byStatus.map((r) => [r._id, r.count]));
  const monthCounts = new Map(result.monthly.map((r) => [r._id, r.count]));

  const shownCourses = course ? courses.filter((c) => String(c._id) === course) : courses;
  const byCourse = shownCourses.map((c) => ({
    courseId: c._id,
    name: c.name,
    code: c.code,
    status: c.status,
    count: courseCounts.get(String(c._id)) ?? 0,
  }));

  const months = result.monthly.length
    ? monthKeys(result.monthly[0]._id, result.monthly[result.monthly.length - 1]._id)
    : [];

  res.json({
    success: true,
    data: {
      filters: { from: req.query.from || null, to: req.query.to || null, course: course || null },
      totals: {
        students: result.total[0]?.count ?? 0,
        courses: courses.length,
        activeCourses: courses.filter((c) => c.status === "active").length,
        instructors: instructorCount,
      },
      byCourse,
      byStatus: ENROLLMENT_STATUSES.map((status) => ({ status, count: statusCounts.get(status) ?? 0 })),
      monthly: months.map((month) => ({ month, count: monthCounts.get(month) ?? 0 })),
      recentStudents: result.recent.map((s) => {
        const c = courseMap.get(String(s.course));
        return {
          _id: s._id,
          fullName: s.fullName,
          email: s.email,
          enrollmentStatus: s.enrollmentStatus ?? "active",
          createdAt: s.createdAt,
          course: c ? { _id: c._id, name: c.name, code: c.code } : null,
        };
      }),
    },
  });
}
