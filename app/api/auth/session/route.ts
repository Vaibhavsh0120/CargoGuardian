import { NextResponse } from "next/server";

import { clearSessionCookie, createSessionCookie, getCurrentSessionUser, setSessionCookie, verifyIdToken } from "@/lib/auth/session";
import { sessionTokenSchema } from "@/lib/validation/auth";
import {
  ensureUserProfile,
  getAuthOnlyUserProfile,
  normalizeRole
} from "@/features/auth/services/user-profile-server";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({ authenticated: true, user });
}

export async function POST(request: Request) {
  try {
    const body = sessionTokenSchema.parse(await request.json());
    const decodedToken = await verifyIdToken(body.idToken);
    const sessionCookie = await createSessionCookie(body.idToken);
    const user = await ensureUserProfile(decodedToken.uid).catch(() =>
      getAuthOnlyUserProfile(decodedToken.uid, {
        defaultRole: normalizeRole(decodedToken.role),
        defaultReadOnly:
          typeof decodedToken.readOnly === "boolean"
            ? decodedToken.readOnly
            : normalizeRole(decodedToken.role) === "viewer"
      })
    );
    const response = NextResponse.json({
      authenticated: true,
      user
    });

    setSessionCookie(response, sessionCookie);
    return response;
  } catch {
    const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }
}
