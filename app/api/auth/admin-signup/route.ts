import { NextResponse } from "next/server";

import { failure } from "@/lib/api/response";
import { createSessionCookie, setSessionCookie, verifyIdToken } from "@/lib/auth/session";
import { adminSessionTokenSchema } from "@/lib/validation/auth";
import { getServerEnv } from "@/lib/env/server";
import { ensureUserProfile, getAuthOnlyUserProfile } from "@/features/auth/services/user-profile-server";

export async function POST(request: Request) {
  try {
    const body = adminSessionTokenSchema.parse(await request.json());
    const { ADMIN_INVITE_SECRET } = getServerEnv();

    if (!ADMIN_INVITE_SECRET || body.inviteCode !== ADMIN_INVITE_SECRET) {
      return failure("Invalid admin invite code.", 403);
    }

    const decodedToken = await verifyIdToken(body.idToken);
    const user = await ensureUserProfile(decodedToken.uid, {
      defaultRole: "admin",
      forceCreate: true
    }).catch(() =>
      getAuthOnlyUserProfile(decodedToken.uid, {
        defaultRole: "admin",
        defaultReadOnly: false
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
    return failure(error instanceof Error ? error.message : "Admin signup failed.", 401);
  }
}
