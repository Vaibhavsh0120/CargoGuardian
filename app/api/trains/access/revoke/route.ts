import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { recordOperationalEvent } from "@/services/events/write";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { canUserManageTrain } from "@/services/trains/access";
import { FieldValue } from "firebase-admin/firestore";

const revokeAccessSchema = z.object({
  trainId: z.string().min(1),
  userEmail: z.string().email()
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    if (user.role !== "admin" && user.role !== "master") {
      return failure("Only admins and masters can revoke access.", 403);
    }

    const body = revokeAccessSchema.parse(await request.json());

    const db = getFirebaseAdminDb();

    const trainDoc = await db.collection("trains").doc(body.trainId).get();
    if (!trainDoc.exists) {
      return failure("Train not found.", 404);
    }

    const trainData = trainDoc.data();
    if (!trainData) {
      return failure("Train data unavailable.", 500);
    }

    if (user.role === "master") {
      const canManage = await canUserManageTrain(
        db,
        user,
        body.trainId,
        typeof trainData.ownerId === "string" ? trainData.ownerId : null
      );
      if (!canManage) {
        return failure("You do not have access to this train.", 403);
      }
    }

    const targetUserSnapshot = await db.collection("users").where("email", "==", body.userEmail.toLowerCase()).limit(1).get();
    if (targetUserSnapshot.empty) {
      return failure(`No user found with email "${body.userEmail}".`, 404);
    }

    const targetUserId = targetUserSnapshot.docs[0].data().uid as string;

    const assignmentSnapshot = await db.collection("trainAssignments")
      .where("trainId", "==", body.trainId)
      .where("userId", "==", targetUserId)
      .get();

    const activeAssignmentDoc = assignmentSnapshot.docs.find((doc) => !doc.data().revokedAt);

    if (!activeAssignmentDoc) {
      return failure("This user does not have access to this train.", 404);
    }

    const assignmentDoc = activeAssignmentDoc;
    const assignmentData = assignmentDoc.data();

    if (assignmentData.grantedBy !== user.uid && user.role !== "admin") {
      return failure("You can only revoke access that you granted.", 403);
    }

    await db.collection("trainAssignments").doc(assignmentDoc.id).update({
      revokedAt: FieldValue.serverTimestamp(),
      revokedBy: user.uid
    });

    await recordOperationalEvent({
      category: "access",
      action: "access-revoked",
      title: "Access revoked",
      description: `${user.displayName ?? user.email ?? "Operator"} revoked access for ${body.userEmail}.`,
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
        revokedUserEmail: body.userEmail
      }
    });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0].message, 400);
    }
    return failure(error instanceof Error ? error.message : "Failed to revoke access.", 500);
  }
}
