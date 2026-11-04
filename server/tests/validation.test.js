import { describe, it, expect } from "vitest";
import * as schemas from "../validation/schemas.js";
import { formatIssues } from "../middleware/validate.js";

const COURSE_ID = "64b7f0c2a1b2c3d4e5f60718";

const validStudent = {
  fullName: "  Asha   Reddy ",
  email: "  ASHA@Example.COM ",
  mobile: " 9876543210 ",
  gender: "female",
  course: COURSE_ID,
  address: "  12 MG Road, Hyderabad  ",
};

function errorsOf(schema, data) {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  return formatIssues(result.error.issues);
}

function fields(errors) {
  return errors.map((e) => e.field);
}

describe("student create", () => {
  it("accepts valid data and normalizes it", () => {
    const result = schemas.studentCreate.safeParse(validStudent);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      fullName: "Asha Reddy",
      email: "asha@example.com",
      mobile: "9876543210",
      address: "12 MG Road, Hyderabad",
    });
  });

  it("reports every missing required field by name", () => {
    const errors = errorsOf(schemas.studentCreate, {});
    expect(fields(errors)).toEqual(
      expect.arrayContaining(["fullName", "email", "mobile", "gender", "course", "address"])
    );
    expect(errors.find((e) => e.field === "fullName").message).toBe("Full name is required");
  });

  it("rejects invalid formats", () => {
    const errors = errorsOf(schemas.studentCreate, {
      ...validStudent,
      email: "not-an-email",
      mobile: "12345",
      gender: "robot",
      course: "BCA",
    });
    expect(fields(errors).sort()).toEqual(["course", "email", "gender", "mobile"]);
  });

  it("rejects unexpected fields such as role or photo", () => {
    const errors = errorsOf(schemas.studentCreate, { ...validStudent, role: "admin", photo: {} });
    expect(errors).toEqual(
      expect.arrayContaining([
        { field: "role", message: "Unexpected field: role" },
        { field: "photo", message: "Unexpected field: photo" },
      ])
    );
  });

  it("rejects non-text values for text fields", () => {
    const errors = errorsOf(schemas.studentCreate, { ...validStudent, fullName: { $ne: "" } });
    expect(fields(errors)).toContain("fullName");
  });

  it("rejects an invalid enrollment status", () => {
    const errors = errorsOf(schemas.studentCreate, { ...validStudent, enrollmentStatus: "graduated" });
    expect(fields(errors)).toContain("enrollmentStatus");
  });
});

describe("student update", () => {
  it("allows a single field", () => {
    expect(schemas.studentUpdate.safeParse({ mobile: "9123456789" }).success).toBe(true);
  });

  it("rejects an empty update", () => {
    const errors = errorsOf(schemas.studentUpdate, {});
    expect(errors[0].message).toBe("Provide at least one field to update");
  });
});

describe("auth", () => {
  it("lowercases the username and email on registration", () => {
    const result = schemas.register.safeParse({ username: " Vivek_1 ", email: "V@X.COM", password: "Passw0rd1" });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ username: "vivek_1", email: "v@x.com" });
  });

  it("rejects a weak password", () => {
    const errors = errorsOf(schemas.register, { username: "vivek", email: "v@x.com", password: "password" });
    expect(errors.find((e) => e.field === "password").message).toMatch(/number/);
  });

  it("rejects a role sent during registration", () => {
    const errors = errorsOf(schemas.register, {
      username: "vivek",
      email: "v@x.com",
      password: "Passw0rd1",
      role: "admin",
    });
    expect(errors).toContainEqual({ field: "role", message: "Unexpected field: role" });
  });

  it("rejects role in a profile update", () => {
    const errors = errorsOf(schemas.updateMe, { role: "admin" });
    expect(fields(errors)).toContain("role");
  });
});

describe("course", () => {
  const validCourse = { name: "Data Science", code: " ds-1 ", durationMonths: 24, fee: 150000 };

  it("uppercases the code and accepts an empty instructor as unassigned", () => {
    const result = schemas.courseCreate.safeParse({ ...validCourse, instructor: "" });
    expect(result.success).toBe(true);
    expect(result.data.code).toBe("DS-1");
    expect(result.data.instructor).toBeNull();
  });

  it("rejects numbers sent as text, fractional durations and negative fees", () => {
    const errors = errorsOf(schemas.courseCreate, { ...validCourse, fee: "free", durationMonths: 1.5 });
    expect(fields(errors).sort()).toEqual(["durationMonths", "fee"]);
    expect(errors.find((e) => e.field === "fee").message).toBe("Fee must be a number");
    expect(fields(errorsOf(schemas.courseCreate, { ...validCourse, fee: -1 }))).toEqual(["fee"]);
  });
});

describe("user role", () => {
  it("allows only known roles", () => {
    expect(schemas.userRole.safeParse({ role: "staff" }).success).toBe(true);
    expect(fields(errorsOf(schemas.userRole, { role: "superadmin" }))).toEqual(["role"]);
  });
});
