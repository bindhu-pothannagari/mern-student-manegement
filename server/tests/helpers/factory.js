import User from "../../models/User.js";
import Course from "../../models/Course.js";
import Student from "../../models/Student.js";
import { signAccessToken } from "../../utils/tokens.js";

let seq = 0;
const next = () => {
  seq += 1;
  return seq;
};

export async function createUser(role = "viewer") {
  const n = next();
  const user = await User.create({
    username: `user${n}`,
    email: `user${n}@test.com`,
    password: "Passw0rd1",
    role,
  });
  const token = signAccessToken(user);
  return { user, token, auth: { Authorization: `Bearer ${token}` } };
}

export function createCourse(overrides = {}) {
  const n = next();
  return Course.create({ name: `Course ${n}`, code: `C${n}`, durationMonths: 12, fee: 1000, ...overrides });
}

export function studentData(course, overrides = {}) {
  const n = next();
  return {
    fullName: "Test Student",
    email: `student${n}@test.com`,
    mobile: "9876543210",
    gender: "female",
    course: String(course._id),
    address: "Test address, Hyderabad",
    ...overrides,
  };
}

export function createStudent(course, overrides = {}) {
  return Student.create(studentData(course, overrides));
}
