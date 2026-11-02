const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(message, status = 0, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the backend is running.");
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // response had no JSON body
  }

  if (!res.ok) {
    throw new ApiError(
      body?.message || `Request failed (${res.status})`,
      res.status,
      body?.errors || []
    );
  }
  return body;
}

export const getStudents = () => request("/students");
export const getStudent = (id) => request(`/students/${id}`);
export const createStudent = (data) =>
  request("/students", { method: "POST", body: JSON.stringify(data) });
export const updateStudent = (id, data) =>
  request(`/students/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteStudent = (id) =>
  request(`/students/${id}`, { method: "DELETE" });