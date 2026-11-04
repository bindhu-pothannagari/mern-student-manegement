import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import Instructor from "../models/Instructor.js";
import { startDb, stopDb, clearDb } from "./helpers/db.js";
import { createUser, createCourse, createStudent } from "./helpers/factory.js";

beforeAll(startDb);
afterAll(stopDb);

let bca, mca, staff, viewer;

beforeEach(async () => {
  await clearDb();
  bca = await createCourse({ code: "BCA" });
  mca = await createCourse({ code: "MCA", status: "inactive" });
  await Instructor.create({ fullName: "Ravi Kumar", email: "ravi@test.com", specialization: "Databases" });
  await createStudent(bca);
  await createStudent(bca);
  await createStudent(bca, { enrollmentStatus: "completed" });
  await createStudent(mca);
  staff = await createUser("staff");
  viewer = await createUser("viewer");
});

describe("dashboard", () => {
  it("returns figures that match the database", async () => {
    const res = await request(app).get("/api/dashboard").set(staff.auth);
    expect(res.status).toBe(200);
    const d = res.body.data;

    expect(d.totals).toEqual({ students: 4, courses: 2, activeCourses: 1, instructors: 1 });
    expect(d.byCourse.find((c) => c.code === "BCA").count).toBe(3);
    expect(d.byCourse.find((c) => c.code === "MCA").count).toBe(1);
    expect(d.byStatus.find((s) => s.status === "active").count).toBe(3);
    expect(d.byStatus.find((s) => s.status === "completed").count).toBe(1);
    expect(d.monthly.reduce((sum, m) => sum + m.count, 0)).toBe(4);
    expect(d.recentStudents).toHaveLength(4);
  });

  it("filters by course", async () => {
    const res = await request(app).get(`/api/dashboard?course=${bca._id}`).set(staff.auth);
    expect(res.body.data.totals.students).toBe(3);
  });

  it("handles an empty date range", async () => {
    const res = await request(app).get("/api/dashboard?from=2000-01-01&to=2000-01-31").set(staff.auth);
    expect(res.body.data.totals.students).toBe(0);
    expect(res.body.data.monthly).toEqual([]);
    expect(res.body.data.recentStudents).toEqual([]);
  });

  it("rejects viewers and invalid filters", async () => {
    const asViewer = await request(app).get("/api/dashboard").set(viewer.auth);
    const badDate = await request(app).get("/api/dashboard?from=04-11-2026").set(staff.auth);
    const reversed = await request(app)
      .get("/api/dashboard?from=2026-12-01&to=2026-11-01")
      .set(staff.auth);
    expect(asViewer.status).toBe(403);
    expect(badDate.status).toBe(400);
    expect(reversed.status).toBe(400);
  });
});
