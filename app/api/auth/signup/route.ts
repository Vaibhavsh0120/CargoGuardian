import { NextResponse } from "next/server";

import { failure } from "@/lib/api/response";
import { createSessionCookie, setSessionCookie, verifyIdToken } from "@/lib/auth/session";
import { sessionTokenSchema } from "@/lib/validation/auth";
import { ensureUserProfile, getAuthOnlyUserProfile } from "@/features/auth/services/user-profile-server";

export async function POST(request: Request) {
  try {
    const body = sessionTokenSchema.parse(await request.json());
    const decodedToken = await verifyIdToken(body.idToken);

    const user = await ensureUserProfile(decodedToken.uid, {
      defaultRole: "not-set",
      forceCreate: true
    }).catch(() =>
      getAuthOnlyUserProfile(decodedToken.uid, {
        defaultRole: "not-set",
        defaultReadOnly: true
      })
    );

    const sessionCookie = await createSessionCookie(body.idToken);

    const response = NextResponse.json({
      authenticated: true,
      user
    });

    setSessionCookie(response, sessionCookie);
    return response;
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Signup failed.", 401);
  }
}
