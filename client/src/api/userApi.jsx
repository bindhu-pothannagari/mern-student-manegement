import { request } from "./client.js";

function toQuery(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const listUsers = (params) => request(`/users${toQuery(params)}`);
export const updateUserRole = (id, role) =>
  request(`/users/${id}/role`, { method: "PATCH", body: { role } });
export const deleteUser = (id) => request(`/users/${id}`, { method: "DELETE" });