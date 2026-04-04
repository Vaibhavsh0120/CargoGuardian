import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getFirebaseAdminAuth } from "@/services/firebase/admin";
import {
  ensureUserProfile,
  getAuthOnlyUserProfile,
  getUserProfile,
  normalizeRole
} from "@/features/auth/services/user-profile-server";

const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 5;

export function setSessionCookie(response: NextResponse, sessionCookie: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionCookie,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function createSessionCookie(idToken: string) {
  const auth = getFirebaseAdminAuth();
  return auth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE * 1000
  });
}

export async function verifyIdToken(idToken: string) {
  const auth = getFirebaseAdminAuth();
  return auth.verifyIdToken(idToken);
}

export async function verifySessionCookieValue(sessionCookie: string) {
  const auth = getFirebaseAdminAuth();
  return auth.verifySessionCookie(sessionCookie, true);
}

export async function getCurrentSessionUser() {
  const sessionCookie = await getSessionToken();

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await verifySessionCookieValue(sessionCookie);
    try {
      return (await getUserProfile(decodedToken.uid)) ?? (await ensureUserProfile(decodedToken.uid));
    } catch {
      return getAuthOnlyUserProfile(decodedToken.uid, {
        defaultRole: normalizeRole(decodedToken.role),
        defaultReadOnly:
          typeof decodedToken.readOnly === "boolean"
            ? decodedToken.readOnly
            : normalizeRole(decodedToken.role) === "worker"
      });
    }
  } catch {
    return null;
  }
}
