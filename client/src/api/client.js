const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(message, status = 0, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let accessToken = null;
let refreshPromise = null;
let onSessionExpired = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

async function send(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the backend is running.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors || []);
  }
  return data;
}

export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = send("/auth/refresh", { method: "POST", auth: false })
      .then((res) => {
        if (!res?.accessToken) throw new ApiError("Not logged in", 401);
        accessToken = res.accessToken;
        return res;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function request(path, options = {}) {
  try {
    return await send(path, options);
  } catch (err) {
    if (options.auth === false || err.status !== 401) throw err;
    try {
      await refreshSession();
    } catch {
      accessToken = null;
      onSessionExpired?.();
      throw new ApiError("Your session has expired. Please log in again", 401);
    }
    return send(path, options);
  }
}