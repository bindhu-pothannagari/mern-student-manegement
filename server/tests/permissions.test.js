import crypto from "crypto";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import User from "../models/User.js";
import StudentDocument from "../models/StudentDocument.js";
import { startDb, stopDb, clearDb } from "./helpers/db.js";
import { createUser, createCourse, createStudent, studentData } from "./helpers/factory.js";

beforeAll(startDb);
afterAll(stopDb);

let course, student, admin, staff, viewer;

beforeEach(async () => {
  await clearDb();
  course = await createCourse();
  student = await createStudent(course);
  admin = await createUser("admin");
  staff = await createUser("staff");
  viewer = await createUser("viewer");
});

describe("students", () => {
  it("requires a token", async () => {
    const res = await request(app).get("/api/students");
    expect(res.status).toBe(401);
  });

  it("lets viewers list students but hides mobile and address", async () => {
    const res = await request(app).get("/api/students").set(viewer.auth);
    expect(res.status).toBe(200);
    expect(res.body.data[0].fullName).toBe("Test Student");
    expect(res.body.data[0].mobile).toBeUndefined();
    expect(res.body.data[0].address).toBeUndefined();
  });

  it("shows mobile and address to staff", async () => {
    const res = await request(app).get("/api/students").set(staff.auth);
    expect(res.body.data[0].mobile).toBe("9876543210");
  });

  it("stops viewers creating, updating or deleting", async () => {
    const create = await request(app).post("/api/students").set(viewer.auth).send(studentData(course));
    const update = await request(app)
      .patch(`/api/students/${student._id}`)
      .set(viewer.auth)
      .send({ address: "Changed address, Hyderabad" });
    const remove = await request(app).delete(`/api/students/${student._id}`).set(viewer.auth);
    expect([create.status, update.status, remove.status]).toEqual([403, 403, 403]);
  });

  it("lets staff create and update, but not change email or delete", async () => {
    const create = await request(app).post("/api/students").set(staff.auth).send(studentData(course));
    expect(create.status).toBe(201);

    const update = await request(app)
      .patch(`/api/students/${student._id}`)
      .set(staff.auth)
      .send({ address: "Changed address, Hyderabad" });
    expect(update.status).toBe(200);

    const email = await request(app)
      .patch(`/api/students/${student._id}`)
      .set(staff.auth)
      .send({ email: "changed@test.com" });
    expect(email.status).toBe(403);

    const remove = await request(app).delete(`/api/students/${student._id}`).set(staff.auth);
    expect(remove.status).toBe(403);
  });

  it("lets admins delete", async () => {
    const res = await request(app).delete(`/api/students/${student._id}`).set(admin.auth);
    expect(res.status).toBe(200);
  });
});

describe("documents", () => {
  it("hides documents from viewers", async () => {
    const res = await request(app).get(`/api/students/${student._id}/documents`).set(viewer.auth);
    expect(res.status).toBe(403);
  });

  it("does not return another student's document when the ID in the URL is changed", async () => {
    const other = await createStudent(course);
    const doc = await StudentDocument.create({
      student: student._id,
      key: `documents/${crypto.randomUUID()}.pdf`,
      originalName: "private.pdf",
      mimeType: "application/pdf",
      size: 10,
    });
    const res = await request(app)
      .get(`/api/students/${other._id}/documents/${doc._id}/download`)
      .set(staff.auth);
    expect(res.status).toBe(404);
  });
});

describe("user management", () => {
  it("is limited to admins", async () => {
    const asStaff = await request(app).get("/api/users").set(staff.auth);
    const asAdmin = await request(app).get("/api/users").set(admin.auth);
    expect(asStaff.status).toBe(403);
    expect(asAdmin.status).toBe(200);
  });

  it("stops admins changing their own role", async () => {
    const res = await request(app)
      .patch(`/api/users/${admin.user._id}/role`)
      .set(admin.auth)
      .send({ role: "viewer" });
    expect(res.status).toBe(403);
  });

  it("signs a user out when an admin changes their role", async () => {
    const change = await request(app)
      .patch(`/api/users/${viewer.user._id}/role`)
      .set(admin.auth)
      .send({ role: "staff" });
    expect(change.status).toBe(200);

    const oldToken = await request(app).get("/api/students").set(viewer.auth);
    expect(oldToken.status).toBe(401);
  });

  it("stops users changing their own role through the profile", async () => {
    const res = await request(app).patch("/api/auth/me").set(viewer.auth).send({ role: "admin" });
    expect(res.status).toBe(400);
    const stored = await User.findById(viewer.user._id);
    expect(stored.role).toBe("viewer");
  });
});
