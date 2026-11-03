import { request } from "./client.js";

export { ApiError } from "./client.js";

export const getStudents = (params = {}) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return request(`/students${qs ? `?${qs}` : ""}`);
};

export const getStudent = (id) => request(`/students/${id}`);
export const createStudent = (data) => request("/students", { method: "POST", body: data });
export const updateStudent = (id, data) =>
  request(`/students/${id}`, { method: "PATCH", body: data });
export const deleteStudent = (id) => request(`/students/${id}`, { method: "DELETE" });