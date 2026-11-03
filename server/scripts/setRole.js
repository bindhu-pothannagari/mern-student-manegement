import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import User, { ROLES } from "../models/User.js";

const [email, role] = process.argv.slice(2);

if (!email || !ROLES.includes(role)) {
  console.error("Usage: npm run set-role -- <email> <admin|staff|viewer>");
  process.exit(1);
}

await connectDB();

const user = await User.findOneAndUpdate(
  { email: email.toLowerCase() },
  { role, $inc: { tokenVersion: 1 } },
  { returnDocument: "after" }
);

if (user) {
  console.log(`${user.email} is now ${user.role}. Their existing sessions were signed out.`);
} else {
  console.error(`No user found with email ${email}`);
}

await mongoose.disconnect();