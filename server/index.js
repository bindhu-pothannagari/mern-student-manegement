import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import Student from "./models/Student.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// TEMPORARY test routes (replaced in Task 7)
app.post("/api/test/students", async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Email already exists" });
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/test/students", async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});