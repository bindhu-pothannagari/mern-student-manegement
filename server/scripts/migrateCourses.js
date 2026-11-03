import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Course from "../models/Course.js";

const KNOWN = {
  BCA: { code: "BCA", durationMonths: 36 },
  BBA: { code: "BBA", durationMonths: 36 },
  "BSc Computer Science": { code: "BSC-CS", durationMonths: 36 },
  MCA: { code: "MCA", durationMonths: 24 },
};

function makeCode(name) {
  const code = name.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 12);
  return code.length >= 2 ? code : `COURSE${code}`;
}

await connectDB();

const students = mongoose.connection.collection("students");
const textCourses = await students.distinct("course", { course: { $type: "string" } });
const names = new Set([...Object.keys(KNOWN), ...textCourses]);

let created = 0;
let updated = 0;

for (const name of names) {
  const known = KNOWN[name] ?? {};
  const code = known.code ?? makeCode(name);

  let course = await Course.findOne({ code });
  if (!course) {
    course = await Course.create({
      name,
      code,
      durationMonths: known.durationMonths ?? 12,
      fee: 0,
      status: "active",
    });
    created += 1;
  }

  const result = await students.updateMany({ course: name }, { $set: { course: course._id } });
  updated += result.modifiedCount;
  console.log(`${code.padEnd(8)} ${name.padEnd(24)} ${result.modifiedCount} students linked`);
}

const leftover = await students.countDocuments({ course: { $type: "string" } });
console.log(`\nCourses created: ${created}. Students updated: ${updated}. Students still with text course: ${leftover}.`);

await mongoose.disconnect();