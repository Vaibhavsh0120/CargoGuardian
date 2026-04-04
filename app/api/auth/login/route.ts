import { NextResponse } from "next/server";

import { failure } from "@/lib/api/response";
import { createSessionCookie, setSessionCookie, verifyIdToken } from "@/lib/auth/session";
import { sessionTokenSchema } from "@/lib/validation/auth";
import {
  ensureUserProfile,
  getAuthOnlyUserProfile,
  normalizeRole
} from "@/features/auth/services/user-profile-server";

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
            : normalizeRole(decodedToken.role) !== "admin" &&
              normalizeRole(decodedToken.role) !== "master"
      })
    );

    const response = NextResponse.json({
      authenticated: true,
      user
    });

    setSessionCookie(response, sessionCookie);
    return response;
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Login failed.", 401);
  }
}
