import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import User from "../models/User.js";
import { startDb, stopDb, clearDb } from "./helpers/db.js";
import { createUser } from "./helpers/factory.js";

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

const newUser = { username: "vivek", email: "vivek@test.com", password: "Passw0rd1" };

describe("register", () => {
  it("creates a viewer, returns a token and sets an httpOnly refresh cookie", async () => {
    const res = await request(app).post("/api/auth/register").send(newUser);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.data.role).toBe("viewer");
    expect(res.body.data.password).toBeUndefined();
    const cookie = res.headers["set-cookie"].join(";");
    expect(cookie).toMatch(/refreshToken=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it("stores a bcrypt hash, never the plain password", async () => {
    await request(app).post("/api/auth/register").send(newUser);
    const user = await User.findOne({ email: newUser.email }).select("+password");
    expect(user.password).not.toBe(newUser.password);
    expect(user.password).toMatch(/^\$2[aby]\$/);
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(newUser);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...newUser, username: "someoneelse" });
    expect(res.status).toBe(409);
  });

  it("rejects invalid input with field errors", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "v", email: "bad", password: "short" });
    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(["username", "email", "password"]));
  });
});

describe("login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(newUser);
  });

  it("accepts correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: newUser.email, password: newUser.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it("gives the same 401 message for a wrong password and an unknown email", async () => {
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: newUser.email, password: "WrongPass1" });
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "Passw0rd1" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });
});

describe("protected routes", () => {
  it("rejects a request without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects an invalid token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("rejects an expired token with 'Session expired'", async () => {
    const { user } = await createUser();
    const expired = jwt.sign(
      { sub: String(user._id), role: user.role, tv: 0, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_ACCESS_SECRET
    );
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Session expired");
  });

  it("returns the current user without sensitive fields", async () => {
    const { user, auth } = await createUser();
    const res = await request(app).get("/api/auth/me").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.tokenVersion).toBeUndefined();
  });
});

describe("refresh and logout", () => {
  it("refreshes with the cookie, and logout invalidates the old token", async () => {
    const agent = request.agent(app);
    const reg = await agent.post("/api/auth/register").send(newUser);
    const oldToken = reg.body.accessToken;

    const refreshed = await agent.post("/api/auth/refresh");
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.accessToken).toBeTruthy();

    const out = await agent.post("/api/auth/logout");
    expect(out.status).toBe(200);

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${oldToken}`);
    expect(me.status).toBe(401);

    const again = await agent.post("/api/auth/refresh");
    expect([204, 401]).toContain(again.status);
    expect(again.body.accessToken).toBeUndefined();
  });
});

describe("password change", () => {
  it("requires the current password and signs out old tokens", async () => {
    const reg = await request(app).post("/api/auth/register").send(newUser);
    const oldAuth = { Authorization: `Bearer ${reg.body.accessToken}` };

    const wrong = await request(app)
      .patch("/api/auth/password")
      .set(oldAuth)
      .send({ currentPassword: "WrongPass1", newPassword: "NewPass123" });
    expect(wrong.status).toBe(400);

    const ok = await request(app)
      .patch("/api/auth/password")
      .set(oldAuth)
      .send({ currentPassword: newUser.password, newPassword: "NewPass123" });
    expect(ok.status).toBe(200);

    const oldTokenNow = await request(app).get("/api/auth/me").set(oldAuth);
    expect(oldTokenNow.status).toBe(401);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: newUser.email, password: "NewPass123" });
    expect(login.status).toBe(200);
  });
});
