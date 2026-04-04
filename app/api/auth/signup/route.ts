import { NextResponse } from "next/server";

import { failure } from "@/lib/api/response";
import { createSessionCookie, setSessionCookie, verifyIdToken } from "@/lib/auth/session";
import { sessionTokenSchema } from "@/lib/validation/auth";
import { ensureUserProfile, getAuthOnlyUserProfile } from "@/features/auth/services/user-profile-server";

export async function POST(request: Request) {
  try {
    const body = sessionTokenSchema.parse(await request.json());
    const decodedToken = await verifyIdToken(body.idToken);

    // Admin signup from invite page sets role immediately.
    // Regular signup defers role selection to /onboarding.
    const isAdmin = body.role === "admin";

    const user = await ensureUserProfile(decodedToken.uid, {
      defaultRole: isAdmin ? "admin" : undefined,
      forceCreate: true
    }).catch(() =>
      getAuthOnlyUserProfile(decodedToken.uid, {
        defaultRole: isAdmin ? "admin" : "worker",
        defaultReadOnly: !isAdmin,
        defaultRoleSelected: isAdmin
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
