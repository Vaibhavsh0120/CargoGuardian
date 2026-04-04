import { NextResponse } from "next/server";
import { z } from "zod";

import { failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/services/firebase/admin";
import { normalizeRole } from "@/features/auth/services/user-profile-server";

const onboardingSchema = z.object({
  role: z.enum(["worker", "master"])
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const body = onboardingSchema.parse(await request.json());
    const role = normalizeRole(body.role);
    const readOnly = role === "worker";

    const db = getFirebaseAdminDb();
    const auth = getFirebaseAdminAuth();

    // Update Firestore Profile
    await db.collection("users").doc(user.uid).update({
      role,
      readOnly,
      roleSelected: true
    });

    // Update Firebase Claims
    await auth.setCustomUserClaims(user.uid, {
      role,
      readOnly
    });

    // Claims propagate on the next session validation cycle.
    // The middleware only checks cookie existence, and the next GET /api/auth/session
    // will read the updated Firestore profile with the new role.

    return NextResponse.json({ success: true, role });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Onboarding failed.", 500);
  }
}
