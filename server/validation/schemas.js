import { z } from "zod";
import { ENROLLMENT_STATUSES } from "../models/Student.js";
import { COURSE_STATUSES } from "../models/Course.js";
import { ROLES } from "../models/User.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID = /^[a-f\d]{24}$/i;

const text = (label, min, max) =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `${label} is required` : `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email must be at most 254 characters")
  .regex(EMAIL, "Enter a valid email address");

const objectId = (label) => z.string().regex(OBJECT_ID, `${label} must be a valid ID`);

const newPassword = z
  .string()
  .min(8, "Password must be 8 to 72 characters")
  .max(72, "Password must be 8 to 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

const atLeastOne = (schema) =>
  schema.refine((data) => Object.keys(data).length > 0, "Provide at least one field to update");

const fullName = text("Full name", 3, 100)
  .regex(/^[A-Za-z .'-]+$/, "Full name can contain only letters, spaces and . ' -")
  .transform((value) => value.replace(/\s+/g, " "));

const studentFields = {
  fullName,
  email,
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  gender: z.enum(["male", "female", "other"], { message: "Gender must be male, female or other" }),
  course: objectId("Course"),
  address: text("Address", 10, 300),
  enrollmentStatus: z.enum(ENROLLMENT_STATUSES, {
    message: `Enrollment status must be one of: ${ENROLLMENT_STATUSES.join(", ")}`,
  }),
};

export const studentCreate = z
  .object({ ...studentFields, enrollmentStatus: studentFields.enrollmentStatus.optional() })
  .strict();

export const studentUpdate = atLeastOne(z.object(studentFields).partial().strict());

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be 3 to 30 characters")
  .max(30, "Username must be 3 to 30 characters")
  .regex(/^[a-z0-9_]+$/, "Username can contain only letters, numbers and underscores");

export const register = z.object({ username, email, password: newPassword }).strict();

export const login = z
  .object({ email, password: z.string().min(1, "Password is required").max(200) })
  .strict();

export const updateMe = atLeastOne(z.object({ username, email }).partial().strict());

export const changePassword = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(200),
    newPassword,
  })
  .strict();

export const forgotPassword = z.object({ email }).strict();

export const resetPassword = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/, "Reset link is invalid or has expired"),
    password: newPassword,
  })
  .strict();

const instructorRef = z.preprocess(
  (value) => (value === "" ? null : value),
  objectId("Instructor").nullable()
);

const courseFields = {
  name: text("Course name", 2, 100),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,12}$/, "Code must be 2-12 letters, numbers or hyphens"),
  description: z.string().trim().max(1000, "Description must be at most 1000 characters"),
  durationMonths: z
    .number()
    .int("Duration must be a whole number of months")
    .min(1, "Duration must be at least 1 month")
    .max(120, "Duration must be at most 120 months"),
  fee: z.number().min(0, "Fee cannot be negative").max(10000000, "Fee is too large"),
  status: z.enum(COURSE_STATUSES, { message: "Status must be active or inactive" }),
  instructor: instructorRef,
};

export const courseCreate = z
  .object({
    ...courseFields,
    description: courseFields.description.optional(),
    status: courseFields.status.optional(),
    instructor: instructorRef.optional(),
  })
  .strict();

export const courseUpdate = atLeastOne(z.object(courseFields).partial().strict());

const instructorFields = {
  fullName: text("Full name", 3, 100),
  email,
  specialization: text("Specialization", 1, 100),
};

export const instructorCreate = z.object(instructorFields).strict();
export const instructorUpdate = atLeastOne(z.object(instructorFields).partial().strict());

export const userRole = z
  .object({ role: z.enum(ROLES, { message: `Role must be one of: ${ROLES.join(", ")}` }) })
  .strict();
