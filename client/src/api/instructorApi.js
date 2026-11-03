import { request } from "./client.js";
import { toQuery } from "./query.js";

export const listInstructors = (params) => request(`/instructors${toQuery(params)}`);
export const getInstructorOptions = () => request("/instructors/options");
export const getInstructor = (id) => request(`/instructors/${id}`);
export const createInstructor = (data) => request("/instructors", { method: "POST", body: data });
export const updateInstructor = (id, data) =>
  request(`/instructors/${id}`, { method: "PATCH", body: data });
export const deleteInstructor = (id) => request(`/instructors/${id}`, { method: "DELETE" });
