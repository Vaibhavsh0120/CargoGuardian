import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { recordOperationalEvent } from "@/services/events/write";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { canUserManageTrain, userHasActiveTrainAssignment } from "@/services/trains/access";
import { FieldValue } from "firebase-admin/firestore";

const delegateSchema = z.object({
  trainId: z.string().min(1),
  userEmail: z.string().email()
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    if (user.role !== "master") {
      return failure("Only masters can delegate view access.", 403);
    }

    const body = delegateSchema.parse(await request.json());
    const db = getFirebaseAdminDb();

    const trainDoc = await db.collection("trains").doc(body.trainId).get();
    if (!trainDoc.exists) {
      return failure("Train not found.", 404);
    }

    const trainData = trainDoc.data();
    if (!trainData) {
      return failure("Train data unavailable.", 500);
    }

    const canManage = await canUserManageTrain(
      db,
      user,
      body.trainId,
      typeof trainData.ownerId === "string" ? trainData.ownerId : null
    );
    if (!canManage) {
      return failure("You do not have access to this train.", 403);
    }

    const targetUserSnapshot = await db.collection("users").where("email", "==", body.userEmail.toLowerCase()).limit(1).get();
    if (targetUserSnapshot.empty) {
      return failure(`No user found with email "${body.userEmail}".`, 404);
    }

    const targetUser = targetUserSnapshot.docs[0].data();
    const targetUserId = targetUser.uid as string;

    if (targetUser.role !== "worker") {
      return failure("Access can only be delegated to workers.", 400);
    }

    if (await userHasActiveTrainAssignment(db, body.trainId, targetUserId)) {
      return failure("This user already has access to this train.", 409);
    }

    const now = FieldValue.serverTimestamp();

    await db.collection("trainAssignments").add({
      trainId: body.trainId,
      userId: targetUserId,
      role: "worker",
      grantedBy: user.uid,
      grantedByEmail: user.email,
      grantedAt: now,
      expiresAt: null
    });

    await recordOperationalEvent({
      category: "access",
      action: "access-delegated",
      title: "Worker access delegated",
      description: `${user.displayName ?? user.email ?? "Operator"} delegated worker access to ${body.userEmail}.`,
      trainId: body.trainId,
      trainCode: typeof trainData.code === "string" ? trainData.code : body.trainId,
      trainLabel:
        typeof trainData.label === "string"
          ? trainData.label
          : typeof trainData.code === "string"
            ? trainData.code
            : body.trainId,
      actorId: user.uid,
      actorLabel: user.displayName ?? user.email ?? "Operator",
      actorRole: user.role,
      metadata: {
        delegatedUserEmail: body.userEmail
      }
    });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0].message, 400);
    }
    return failure(error instanceof Error ? error.message : "Failed to delegate access.", 500);
  }
}
