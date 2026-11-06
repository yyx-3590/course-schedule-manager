const TOKEN_KEY = "token";
const UNREACHABLE = "Can't reach the server. Check that the backend is running.";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

// One message per line, without repeats
export const errorMessages = (err) => [...new Set(err.details?.map((d) => d.message) ?? [err.message])];

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(UNREACHABLE, 0);
  }
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // An expired or invalid token logs the user out
    if (res.status === 401 && token) window.dispatchEvent(new Event("auth:expired"));
    // An empty 5xx body usually means the dev proxy could not reach the backend
    const fallback = res.status >= 500 ? UNREACHABLE : `Request failed (${res.status})`;
    throw new ApiError(data.message || fallback, res.status, data.details);
  }
  return data;
}

export const api = {
  register: (body) => request("/users/register", { method: "POST", body }),
  login: (body) => request("/users/login", { method: "POST", body }),
  forgotPassword: (body) => request("/users/forgot-password", { method: "POST", body }),
  resetPassword: (body) => request("/users/reset-password", { method: "POST", body }),
  listCourses: () => request("/courses"),
  createCourse: (body) => request("/courses", { method: "POST", body }),
  updateCourse: (id, body) => request(`/courses/${id}`, { method: "PUT", body }),
  deleteCourses: (ids) => request("/courses", { method: "DELETE", body: { ids } }),
};
