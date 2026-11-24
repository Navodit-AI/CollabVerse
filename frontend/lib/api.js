// Shared API helpers: base URL, auth token, and friendly error messages.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const getToken = () => (typeof window === "undefined" ? null : localStorage.getItem("token"));

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const saveSession = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// fetch() wrapper: adds JSON + auth headers, a timeout (Render's free tier can take ~60s to wake),
// and turns failures into readable messages.
export async function api(path, { method = "GET", body, timeoutMs = 60000, signal, raw = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("timeout", "TimeoutError")), timeoutMs);
  signal?.addEventListener("abort", () => controller.abort(signal.reason));

  const token = getToken();
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (signal?.aborted) throw err;
    if (err?.name === "TimeoutError" || controller.signal.reason?.name === "TimeoutError") {
      throw new ApiError("The server took too long to respond. It may be waking up, so try again in a moment.", 0);
    }
    throw new ApiError("Can't reach the server. Check your connection, or try again in a minute if it's waking up.", 0);
  }

  clearTimeout(timer); // headers arrived; don't cut off a long streaming body
  if (raw && res.ok) return res; // caller reads the body itself (streaming)

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) {
      clearSession();
      if (typeof window !== "undefined" && !path.startsWith("/api/auth")) window.location.href = "/login";
    }
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}
