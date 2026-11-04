import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { startDb, stopDb, clearDb } from "./helpers/db.js";
import { createCourse, createStudent } from "./helpers/factory.js";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe("public course list", () => {
  it("works without login and returns only active courses with safe fields", async () => {
    const open = await createCourse({ code: "BCA", name: "BCA" });
    await createCourse({ code: "OLD", status: "inactive" });
    await createStudent(open);

    const res = await request(app).get("/api/public/courses");
    expect(res.status).toBe(200);
    expect(res.body.data.map((c) => c.code)).toEqual(["BCA"]);
    expect(Object.keys(res.body.data[0]).sort()).toEqual(
      ["_id", "code", "description", "durationMonths", "fee", "name"].sort()
    );
  });
});
