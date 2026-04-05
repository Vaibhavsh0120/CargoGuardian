import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { recordOperationalEvent } from "@/services/events/write";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { userHasActiveTrainAssignment } from "@/services/trains/access";
import { FieldValue } from "firebase-admin/firestore";

const requestAccessSchema = z
  .object({
    trainId: z.string().optional(),
    trainCode: z.string().trim().min(1).max(64).optional(),
    reason: z.string().min(10).max(500)
  })
  .refine((value) => Boolean(value.trainId || value.trainCode), {
    message: "Train id or train code is required."
  });

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const body = requestAccessSchema.parse(await request.json());
    const db = getFirebaseAdminDb();

    const trainDoc = body.trainId
      ? await db.collection("trains").doc(body.trainId).get()
      : (
          await db
            .collection("trains")
            .where("code", "==", body.trainCode?.trim().toUpperCase() ?? "")
            .limit(1)
            .get()
        ).docs[0];
    if (!trainDoc || !trainDoc.exists) {
      return failure("Train not found.", 404);
    }

    const trainData = trainDoc.data();
    if (!trainData) {
      return failure("Train data unavailable.", 500);
    }

    const trainId = trainDoc.id;

    if (await userHasActiveTrainAssignment(db, trainId, user.uid)) {
      return failure("You already have access to this train.", 409);
    }

    const existingRequestSnapshot = await db
      .collection("accessRequests")
      .where("trainId", "==", trainId)
      .where("userId", "==", user.uid)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingRequestSnapshot.empty) {
      return failure("You already have a pending access request for this train.", 409);
    }

    await db.collection("accessRequests").add({
      trainId,
      trainCode: trainData.code ?? trainId,
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

    await recordOperationalEvent({
      category: "access",
      action: "access-requested",
      title: "Access requested",
      description: `${user.displayName ?? user.email ?? "Worker"} requested access to ${String(trainData.code ?? trainId)}.`,
      trainId,
      trainCode: typeof trainData.code === "string" ? trainData.code : trainId,
      trainLabel: typeof trainData.label === "string" ? trainData.label : typeof trainData.code === "string" ? trainData.code : trainId,
      actorId: user.uid,
      actorLabel: user.displayName ?? user.email ?? "Operator",
      actorRole: user.role,
      metadata: {
        reason: body.reason
      }
    });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0].message, 400);
    }
    return failure(error instanceof Error ? error.message : "Failed to request access.", 500);
  }
}
