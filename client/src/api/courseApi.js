import { request } from "./client.js";
import { toQuery } from "./query.js";

export const listCourses = (params) => request(`/courses${toQuery(params)}`);
export const getCourseOptions = () => request("/courses/options");
export const getCourse = (id) => request(`/courses/${id}`);
export const getCourseStudents = (id, params) => request(`/courses/${id}/students${toQuery(params)}`);
export const createCourse = (data) => request("/courses", { method: "POST", body: data });
export const updateCourse = (id, data) => request(`/courses/${id}`, { method: "PATCH", body: data });
export const deleteCourse = (id) => request(`/courses/${id}`, { method: "DELETE" });