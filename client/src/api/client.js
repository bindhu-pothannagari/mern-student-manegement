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

function fileNameFrom(header) {
  if (!header) return "";
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) return decodeURIComponent(encoded[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : "";
}

async function send(path, { method = "GET", body, auth = true, responseType = "json" } = {}) {
  const isForm = body instanceof FormData;
  const headers = {};
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the backend is running.");
  }

  if (res.ok && responseType === "blob") {
    return { blob: await res.blob(), fileName: fileNameFrom(res.headers.get("Content-Disposition")) };
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
