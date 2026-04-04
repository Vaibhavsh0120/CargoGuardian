import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { userHasActiveTrainAssignment } from "@/services/trains/access";
import { FieldValue } from "firebase-admin/firestore";

const requestAccessSchema = z.object({
  trainId: z.string(),
  reason: z.string().min(10).max(500)
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const body = requestAccessSchema.parse(await request.json());
    const db = getFirebaseAdminDb();

    const trainDoc = await db.collection("trains").doc(body.trainId).get();
    if (!trainDoc.exists) {
      return failure("Train not found.", 404);
    }

    const trainData = trainDoc.data();
    if (!trainData) {
      return failure("Train data unavailable.", 500);
    }

    if (await userHasActiveTrainAssignment(db, body.trainId, user.uid)) {
      return failure("You already have access to this train.", 409);
    }

    const existingRequestSnapshot = await db
      .collection("accessRequests")
      .where("trainId", "==", body.trainId)
      .where("userId", "==", user.uid)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingRequestSnapshot.empty) {
      return failure("You already have a pending access request for this train.", 409);
    }

    await db.collection("accessRequests").add({
      trainId: body.trainId,
      trainCode: trainData.code ?? body.trainId,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      role: user.role,
      reason: body.reason,
      status: "pending",
      requestedBy: user.uid,
      requestedAt: FieldValue.serverTimestamp(),
      reviewedBy: null,
      reviewedAt: null
    });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0].message, 400);
    }
    return failure(error instanceof Error ? error.message : "Failed to request access.", 500);
  }
}
