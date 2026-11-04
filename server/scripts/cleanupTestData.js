import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Student from "../models/Student.js";
import StudentDocument from "../models/StudentDocument.js";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run in production.");
  process.exit(1);
}

const pattern = /@example\.com$/i;
await connectDB();

const targets = await Student.find({ email: pattern }).select("_id email");
console.log(`Test students found: ${targets.length}`);

if (process.argv.includes("--confirm")) {
  const ids = targets.map((s) => s._id);
  const docs = await StudentDocument.deleteMany({ student: { $in: ids } });
  const removed = await Student.deleteMany({ _id: { $in: ids } });
  console.log(`Removed ${removed.deletedCount} students and ${docs.deletedCount} document records.`);
} else {
  targets.slice(0, 10).forEach((s) => console.log(`  ${s.email}`));
  console.log("Nothing deleted. Run again with --confirm to remove them.");
}

await mongoose.disconnect();
