import { request } from "./client.js";

export const registerUser = (data) =>
  request("/auth/register", { method: "POST", body: data, auth: false });
export const loginUser = (data) =>
  request("/auth/login", { method: "POST", body: data, auth: false });
export const logoutUser = () => request("/auth/logout", { method: "POST", auth: false });
export const getMe = () => request("/auth/me");
export const updateMe = (data) => request("/auth/me", { method: "PATCH", body: data });
export const changePassword = (data) =>
  request("/auth/password", { method: "PATCH", body: data });
export const forgotPassword = (email) =>
  request("/auth/forgot-password", { method: "POST", body: { email }, auth: false });
export const resetPassword = (token, password) =>
  request("/auth/reset-password", { method: "POST", body: { token, password }, auth: false });