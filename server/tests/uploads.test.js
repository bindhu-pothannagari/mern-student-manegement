import fs from "fs/promises";
import path from "path";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { startDb, stopDb, clearDb } from "./helpers/db.js";
import { createUser, createCourse, createStudent } from "./helpers/factory.js";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);
const PDF = Buffer.from("%PDF-1.4\n% test document\n");
const dir = (folder) => path.join(process.env.UPLOAD_DIR, folder);

async function countFiles(folder) {
  try {
    return (await fs.readdir(dir(folder))).length;
  } catch {
    return 0;
  }
}

function binary(res, callback) {
  const chunks = [];
  res.on("data", (chunk) => chunks.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
}

beforeAll(async () => {
  await fs.rm(process.env.UPLOAD_DIR, { recursive: true, force: true });
  await startDb();
});
afterAll(stopDb);

let student, admin, staff, viewer;

beforeEach(async () => {
  await clearDb();
  await fs.rm(process.env.UPLOAD_DIR, { recursive: true, force: true });
  student = await createStudent(await createCourse());
  admin = await createUser("admin");
  staff = await createUser("staff");
  viewer = await createUser("viewer");
});

const photoUrl = () => `/api/students/${student._id}/photo`;
const docsUrl = () => `/api/students/${student._id}/documents`;

describe("photos", () => {
  it("accepts a real PNG and serves the same bytes safely", async () => {
    const up = await request(app).put(photoUrl()).set(staff.auth).attach("file", PNG, "photo.png");
    expect(up.status).toBe(200);

    const res = await request(app).get(photoUrl()).set(viewer.auth).buffer(true).parse(binary);
    expect(res.status).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(Buffer.compare(res.body, PNG)).toBe(0);
  });

  it("rejects text disguised as an image", async () => {
    const res = await request(app)
      .put(photoUrl())
      .set(staff.auth)
      .attach("file", Buffer.from("<script>alert(1)</script>"), "fake.jpg");
    expect(res.status).toBe(400);
  });

  it("rejects an extension that does not match the content", async () => {
    const res = await request(app).put(photoUrl()).set(staff.auth).attach("file", PNG, "renamed.jpg");
    expect(res.status).toBe(400);
  });

  it("rejects files over the size limit", async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)]);
    const res = await request(app).put(photoUrl()).set(staff.auth).attach("file", big, "big.png");
    expect(res.status).toBe(413);
  });

  it("stops viewers uploading", async () => {
    const res = await request(app).put(photoUrl()).set(viewer.auth).attach("file", PNG, "photo.png");
    expect(res.status).toBe(403);
  });

  it("keeps one file on replace and none after removal", async () => {
    await request(app).put(photoUrl()).set(staff.auth).attach("file", PNG, "one.png");
    await request(app).put(photoUrl()).set(staff.auth).attach("file", PNG, "two.png");
    expect(await countFiles("photos")).toBe(1);

    const removed = await request(app).delete(photoUrl()).set(staff.auth);
    expect(removed.status).toBe(200);
    expect(await countFiles("photos")).toBe(0);
  });
});

describe("documents", () => {
  it("uploads, lists without storage keys and downloads as an attachment", async () => {
    const up = await request(app).post(docsUrl()).set(staff.auth).attach("file", PDF, "notes.pdf");
    expect(up.status).toBe(201);

    const list = await request(app).get(docsUrl()).set(staff.auth);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].key).toBeUndefined();

    const id = list.body.data[0]._id;
    const dl = await request(app)
      .get(`${docsUrl()}/${id}/download`)
      .set(staff.auth)
      .buffer(true)
      .parse(binary);
    expect(dl.status).toBe(200);
    expect(dl.headers["content-disposition"]).toMatch(/attachment/);
    expect(Buffer.compare(dl.body, PDF)).toBe(0);
  });

  it("only lets admins delete documents, and removes the file", async () => {
    const up = await request(app).post(docsUrl()).set(staff.auth).attach("file", PDF, "notes.pdf");
    const id = up.body.data._id;

    const asStaff = await request(app).delete(`${docsUrl()}/${id}`).set(staff.auth);
    expect(asStaff.status).toBe(403);

    const asAdmin = await request(app).delete(`${docsUrl()}/${id}`).set(admin.auth);
    expect(asAdmin.status).toBe(200);
    expect(await countFiles("documents")).toBe(0);
  });
});
