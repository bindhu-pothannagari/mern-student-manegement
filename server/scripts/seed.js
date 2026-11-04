import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Instructor from "../models/Instructor.js";
import Student from "../models/Student.js";

const DOMAIN = "demo.example.com";
const PASSWORD = "Demo@1234";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed demo data in production.");
  process.exit(1);
}

const reset = process.argv.includes("--reset");

const INSTRUCTORS = [
  { fullName: "Ravi Kumar", email: `ravi.kumar@${DOMAIN}`, specialization: "Databases" },
  { fullName: "Priya Sharma", email: `priya.sharma@${DOMAIN}`, specialization: "Machine Learning" },
  { fullName: "Anil Mehta", email: `anil.mehta@${DOMAIN}`, specialization: "Business Management" },
];

const COURSES = [
  { code: "BCA", name: "Bachelor of Computer Applications", durationMonths: 36, fee: 120000, status: "active", teacher: 0,
    description: "Programming, databases, networking and web development." },
  { code: "BBA", name: "Bachelor of Business Administration", durationMonths: 36, fee: 110000, status: "active", teacher: 2,
    description: "Management, accounting, marketing and business law." },
  { code: "BSC-CS", name: "BSc Computer Science", durationMonths: 36, fee: 115000, status: "active", teacher: 0,
    description: "Algorithms, operating systems and theory of computation." },
  { code: "MCA", name: "Master of Computer Applications", durationMonths: 24, fee: 160000, status: "active", teacher: 1,
    description: "Advanced software engineering and data systems." },
  { code: "DS", name: "Data Science", durationMonths: 12, fee: 150000, status: "inactive", teacher: 1,
    description: "Statistics, machine learning and data visualisation. New intake paused." },
];

const NAMES = [
  ["Asha Reddy", "female"], ["Rahul Verma", "male"], ["Sneha Iyer", "female"], ["Arjun Nair", "male"],
  ["Divya Menon", "female"], ["Karthik Rao", "male"], ["Meera Pillai", "female"], ["Vikram Singh", "male"],
  ["Ananya Gupta", "female"], ["Rohan Das", "male"], ["Kavya Joshi", "female"], ["Siddharth Bose", "male"],
  ["Pooja Patel", "female"], ["Aditya Kulkarni", "male"], ["Lakshmi Krishnan", "female"], ["Nikhil Jain", "male"],
  ["Ishita Banerjee", "female"], ["Manoj Yadav", "male"], ["Riya Kapoor", "female"], ["Sai Teja", "male"],
  ["Harini Subramanian", "female"], ["Varun Chopra", "male"], ["Nandini Shetty", "female"], ["Alex Thomas", "other"],
];

const CITIES = ["Hyderabad", "Bengaluru", "Chennai", "Pune", "Mumbai", "Kochi"];
const STATUSES = ["active", "active", "active", "active", "completed", "withdrawn", "active", "suspended"];

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(10 + (days % 7), (days * 7) % 60, 0, 0);
  return d;
}

await connectDB();

const existing = await User.countDocuments({ email: new RegExp(`@${DOMAIN.replace(/\./g, "\\.")}$`) });
if (existing && !reset) {
  console.log("Demo data already exists. Run `npm run seed -- --reset` to recreate it.");
  await mongoose.disconnect();
  process.exit(0);
}

if (reset) {
  const pattern = new RegExp(`@${DOMAIN.replace(/\./g, "\\.")}$`);
  await Promise.all([
    User.deleteMany({ email: pattern }),
    Student.deleteMany({ email: pattern }),
    Instructor.deleteMany({ email: pattern }),
  ]);
  console.log("Removed previous demo users, students and instructors.");
}

for (const [role, name] of [["admin", "admin"], ["staff", "staff"], ["viewer", "viewer"]]) {
  await User.create({ username: `demo_${name}`, email: `${name}@${DOMAIN}`, password: PASSWORD, role });
}

const instructors = [];
for (const data of INSTRUCTORS) {
  instructors.push(await Instructor.findOneAndUpdate({ email: data.email }, data, { upsert: true, returnDocument: "after" }));
}

const courses = [];
for (const { teacher, ...data } of COURSES) {
  courses.push(
    await Course.findOneAndUpdate(
      { code: data.code },
      { ...data, instructor: instructors[teacher]._id },
      { upsert: true, returnDocument: "after", runValidators: true }
    )
  );
}

const students = NAMES.map(([fullName, gender], i) => {
  const course = courses[i % 4];
  const createdAt = daysAgo(5 + i * 7);
  const email = `${fullName.toLowerCase().replace(/[^a-z]+/g, ".")}@${DOMAIN}`;
  return {
    fullName,
    email,
    mobile: `9${String(800000000 + i * 1234567).slice(0, 9)}`,
    gender,
    course: course._id,
    address: `${10 + i}, Main Road, ${CITIES[i % CITIES.length]}`,
    enrollmentStatus: STATUSES[i % STATUSES.length],
    enrollmentEmail: { status: "sent", attempts: 1, sentAt: createdAt },
    photo: null,
    createdAt,
    updatedAt: createdAt,
  };
});
await Student.collection.insertMany(students);

console.log(`Demo data ready:
  Users:       3 (password for all: ${PASSWORD})
               admin@${DOMAIN}   (admin)
               staff@${DOMAIN}   (staff)
               viewer@${DOMAIN}  (viewer)
  Instructors: ${instructors.length}
  Courses:     ${courses.length} (one inactive)
  Students:    ${students.length}, registered over the last ${Math.ceil((5 + (NAMES.length - 1) * 7) / 30)} months`);

await mongoose.disconnect();
