// In dev, Vite proxies /api to the local Express server.
// In prod, set VITE_API_BASE_URL to the API origin (e.g. https://api.example.com).
const API_BASE = (import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "") + "/api";

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter | null = null;

/**
 * Wired from <ClerkAuthBridge/> at app start so the entire codebase can use
 * apiFetch without thinking about auth — the call is a no-op when no Clerk
 * session is available.
 */
export function setApiTokenGetter(getter: TokenGetter | null) {
  tokenGetter = getter;
}

function getRole(): string | null {
  try { return localStorage.getItem("autospot-role"); } catch { return null; }
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const role = getRole();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (role) headers["x-autospot-role"] = role;

  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // Continue unauthenticated; downstream will return 401 if required.
    }
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Error del servidor" }));
    const error = new Error(err.message || `HTTP ${res.status}`);
    (error as any).status = res.status;
    (error as any).code = err.error;
    throw error;
  }
  // Some endpoints (e.g., DELETE) may return 204 No Content.
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function apiFetchSafe<T = unknown>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options);
  } catch {
    return null;
  }
}
