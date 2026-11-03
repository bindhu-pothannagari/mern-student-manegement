import { request } from "./client.js";

export const resendEnrollmentEmail = (id) =>
  request(`/students/${id}/enrollment-email`, { method: "POST" });
