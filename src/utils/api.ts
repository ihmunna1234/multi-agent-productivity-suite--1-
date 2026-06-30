/**
 * Utility for making authenticated fetch requests to our API.
 * Automatically attaches the JWT token from localStorage and emits a "logout"
 * event if a 401 Unauthorized response is received.
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
    // If unauthorized, clear the token and trigger a logout event
    localStorage.removeItem("workspace_token");
    window.dispatchEvent(new Event("auth-unauthorized"));
  }

  return response;
}
