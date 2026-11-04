import { request } from "./client.js";

export const getPublicCourses = () => request("/public/courses", { auth: false });
