import type { AuthSessionResponse, SessionCookiePayload } from "@/features/auth/types/auth";

async function postAuthCookie(endpoint: string, payload: SessionCookiePayload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? "Authentication request failed.");
  }

  return (await response.json()) as AuthSessionResponse;
}

export async function createLoginSession(idToken: string) {
  return postAuthCookie("/api/auth/login", { idToken });
}

export async function createSignupSession(idToken: string, role?: "admin") {
  return postAuthCookie("/api/auth/signup", { idToken, ...(role && { role }) });
}

export async function syncSession(idToken: string) {
  return postAuthCookie("/api/auth/session", { idToken });
}

export async function destroySession() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? "Logout failed.");
  }
}

export async function fetchSession() {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store"
  });

  if (!response.ok) {
    return { authenticated: false, user: null } satisfies AuthSessionResponse;
  }

  return (await response.json()) as AuthSessionResponse;
}
