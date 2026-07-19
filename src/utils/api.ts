/**
 * Utility for making authenticated fetch requests to our API.
 * Automatically attaches the JWT token from localStorage and handles
 * token expiry (401) by clearing the token and emitting "auth-unauthorized".
 *
 * VULN-03 fix: All API requests now carry the Bearer token. A login helper
 * is exported so the app can authenticate and receive a fresh JWT.
 */

/**
 * Log in with the workspace passcode and store the returned JWT in localStorage.
 * Returns true on success, false on failure.
 */
export async function login(passcode: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("workspace_token", data.token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Clear the JWT and notify the app to show the login screen.
 */
export function logout(): void {
  localStorage.removeItem("workspace_token");
  window.dispatchEvent(new Event("auth-unauthorized"));
}

/**
 * Make an authenticated fetch request. Attaches the Bearer JWT automatically.
 * Triggers logout event on 401 Unauthorized.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("workspace_token");

  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    // Token is missing, invalid or expired — clear and force re-login
    localStorage.removeItem("workspace_token");
    window.dispatchEvent(new Event("auth-unauthorized"));
  }

  return response;
}
