import os from "os";
import path from "path";
import { vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-for-automated-tests-only";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-for-automated-tests-only";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.UPLOAD_DIR = path.join(os.tmpdir(), "mern-student-test-uploads");

vi.mock("../../services/email/enrollmentEmail.js", () => ({
  queueEnrollmentConfirmation: vi.fn(),
  sendEnrollmentConfirmation: vi.fn(async () => ({ status: "sent" })),
}));
