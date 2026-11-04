import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import Student from "../models/Student.js";
import Instructor from "../models/Instructor.js";
import Course from "../models/Course.js";
import {
  queueEnrollmentConfirmation,
  sendEnrollmentConfirmation,
} from "../services/email/enrollmentEmail.js";
import { startDb, stopDb, clearDb } from "./helpers/db.js";
import { createUser, createCourse, createStudent, studentData } from "./helpers/factory.js";

const MISSING_ID = "64b7f0c2a1b2c3d4e5f60718";

beforeAll(startDb);
afterAll(stopDb);

let course, admin, staff;

beforeEach(async () => {
  await clearDb();
  course = await createCourse({ name: "Bachelor of Computer Applications", code: "BCA" });
  admin = await createUser("admin");
  staff = await createUser("staff");
});

describe("student CRUD", () => {
  it("creates a student, returns the course and queues one confirmation email", async () => {
    const res = await request(app).post("/api/students").set(staff.auth).send(studentData(course));
    expect(res.status).toBe(201);
    expect(res.body.data.course.code).toBe("BCA");
    expect(res.body.data.enrollmentEmail.status).toBe("pending");
    expect(queueEnrollmentConfirmation).toHaveBeenCalledTimes(1);
  });

  it("rejects a duplicate email with 409", async () => {
    const data = studentData(course);
    await request(app).post("/api/students").set(staff.auth).send(data);
    const res = await request(app).post("/api/students").set(staff.auth).send(data);
    expect(res.status).toBe(409);
  });

  it("rejects a course that does not exist or is inactive", async () => {
    const missing = await request(app)
      .post("/api/students")
      .set(staff.auth)
      .send(studentData(course, { course: MISSING_ID }));
    expect(missing.status).toBe(400);

    const inactive = await createCourse({ status: "inactive" });
    const res = await request(app).post("/api/students").set(staff.auth).send(studentData(inactive));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a malformed ID and 404 for an unknown one", async () => {
    const bad = await request(app).get("/api/students/123").set(staff.auth);
    const unknown = await request(app).get(`/api/students/${MISSING_ID}`).set(staff.auth);
    expect(bad.status).toBe(400);
    expect(unknown.status).toBe(404);
  });

  it("updates and deletes a student", async () => {
    const student = await createStudent(course);
    const update = await request(app)
      .patch(`/api/students/${student._id}`)
      .set(staff.auth)
      .send({ enrollmentStatus: "completed" });
    expect(update.status).toBe(200);
    expect(update.body.data.enrollmentStatus).toBe("completed");

    const remove = await request(app).delete(`/api/students/${student._id}`).set(admin.auth);
    expect(remove.status).toBe(200);
    const after = await request(app).get(`/api/students/${student._id}`).set(admin.auth);
    expect(after.status).toBe(404);
  });

  it("rejects malformed JSON", async () => {
    const res = await request(app)
      .post("/api/students")
      .set(staff.auth)
      .set("Content-Type", "application/json")
      .send('{"fullName": "oops"');
    expect(res.status).toBe(400);
  });
});

describe("search, filtering and pagination", () => {
  let other;

  beforeEach(async () => {
    other = await createCourse({ name: "Master of Computer Applications", code: "MCA" });
    for (let i = 0; i < 12; i += 1) await createStudent(course, { fullName: `Bca Student ${i}` });
    for (let i = 0; i < 3; i += 1) await createStudent(other, { fullName: `Mca Student ${i}` });
    await createStudent(course, { fullName: "Aaron Unique", email: "aaron@test.com" });
  });

  it("paginates with a total count", async () => {
    const page1 = await request(app).get("/api/students?limit=10").set(staff.auth);
    const page2 = await request(app).get("/api/students?limit=10&page=2").set(staff.auth);
    expect(page1.body.total).toBe(16);
    expect(page1.body.totalPages).toBe(2);
    expect(page1.body.data).toHaveLength(10);
    expect(page2.body.data).toHaveLength(6);
  });

  it("searches by name and email", async () => {
    const byName = await request(app).get("/api/students?search=unique").set(staff.auth);
    const byEmail = await request(app).get("/api/students?search=aaron@").set(staff.auth);
    expect(byName.body.total).toBe(1);
    expect(byEmail.body.total).toBe(1);
  });

  it("filters by course and keeps the filter while paging", async () => {
    const res = await request(app).get(`/api/students?course=${other._id}&limit=10&page=1`).set(staff.auth);
    expect(res.body.total).toBe(3);
    expect(res.body.data.every((s) => s.course.code === "MCA")).toBe(true);
  });

  it("sorts by name", async () => {
    const res = await request(app).get("/api/students?sort=name&order=asc").set(staff.auth);
    expect(res.body.data[0].fullName).toBe("Aaron Unique");
  });

  it("rejects invalid query parameters", async () => {
    const urls = [
      "/api/students?limit=7",
      "/api/students?page=0",
      "/api/students?course=BCA",
      "/api/students?sort=password",
      "/api/students?gender=robot",
    ];
    for (const url of urls) {
      const res = await request(app).get(url).set(staff.auth);
      expect(res.status, url).toBe(400);
    }
  });
});

describe("courses and instructors", () => {
  it("creates a course with an uppercased code and rejects duplicates", async () => {
    const body = { name: "Data Science", code: "ds", durationMonths: 24, fee: 150000 };
    const first = await request(app).post("/api/courses").set(admin.auth).send(body);
    expect(first.status).toBe(201);
    expect(first.body.data.code).toBe("DS");

    const second = await request(app).post("/api/courses").set(admin.auth).send(body);
    expect(second.status).toBe(409);
  });

  it("rejects an instructor that does not exist", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set(admin.auth)
      .send({ name: "Bad", code: "BAD", durationMonths: 12, fee: 0, instructor: MISSING_ID });
    expect(res.status).toBe(400);
  });

  it("stops staff creating courses", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set(staff.auth)
      .send({ name: "Nope", code: "NOPE", durationMonths: 12, fee: 0 });
    expect(res.status).toBe(403);
  });

  it("counts students per course", async () => {
    await createStudent(course);
    await createStudent(course);
    const res = await request(app).get("/api/courses").set(staff.auth);
    expect(res.body.data.find((c) => c.code === "BCA").studentCount).toBe(2);
  });

  it("blocks deleting a course that has students", async () => {
    await createStudent(course);
    const blocked = await request(app).delete(`/api/courses/${course._id}`).set(admin.auth);
    expect(blocked.status).toBe(409);

    const empty = await createCourse();
    const ok = await request(app).delete(`/api/courses/${empty._id}`).set(admin.auth);
    expect(ok.status).toBe(200);
  });

  it("unassigns courses when their instructor is deleted", async () => {
    const instructor = await Instructor.create({
      fullName: "Ravi Kumar",
      email: "ravi@test.com",
      specialization: "Databases",
    });
    await Course.updateOne({ _id: course._id }, { instructor: instructor._id });

    const res = await request(app).delete(`/api/instructors/${instructor._id}`).set(admin.auth);
    expect(res.status).toBe(200);
    const updated = await Course.findById(course._id);
    expect(updated.instructor).toBeNull();
  });
});

describe("enrollment email resend", () => {
  it("resends a failed email and refuses one already sent", async () => {
    const student = await createStudent(course);
    await Student.updateOne({ _id: student._id }, { "enrollmentEmail.status": "failed" });

    const resend = await request(app).post(`/api/students/${student._id}/enrollment-email`).set(staff.auth);
    expect(resend.status).toBe(200);
    expect(sendEnrollmentConfirmation).toHaveBeenCalledTimes(1);

    await Student.updateOne({ _id: student._id }, { "enrollmentEmail.status": "sent" });
    const again = await request(app).post(`/api/students/${student._id}/enrollment-email`).set(staff.auth);
    expect(again.status).toBe(409);
  });
});
