const API_BASE = "/api";

function getRole(): string | null {
  try { return localStorage.getItem("autospot-role"); } catch { return null; }
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const role = getRole();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (role) {
    headers["x-autospot-role"] = role;
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
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}
