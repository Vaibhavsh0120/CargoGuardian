import { NextResponse } from "next/server";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

import { failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/services/firebase/admin";
import { normalizeRole } from "@/features/auth/services/user-profile-server";
import { isRoleSelectionRequired } from "@/types/user";

const onboardingSchema = z.object({
  role: z.enum(["worker", "master"])
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser({ allowIncomplete: true });
    if (!user) {
      return failure("Unauthorized", 401);
    }

    if (!isRoleSelectionRequired(user.role)) {
      return failure("Role has already been selected.", 409);
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
      updatedAt: FieldValue.serverTimestamp(),
      roleSelected: FieldValue.delete()
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
