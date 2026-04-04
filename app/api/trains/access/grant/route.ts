import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { canUserManageTrain, userHasActiveTrainAssignment } from "@/services/trains/access";
import { FieldValue } from "firebase-admin/firestore";

const grantAccessSchema = z.object({
  trainId: z.string().min(1),
  userEmail: z.string().email(),
  role: z.enum(["master", "worker"])
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    if (user.role !== "admin" && user.role !== "master") {
      return failure("Only admins and masters can grant access.", 403);
    }

    const body = grantAccessSchema.parse(await request.json());

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
      if (body.role !== "worker") {
        return failure("Masters can only grant worker access.", 403);
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
    }

    const targetUserSnapshot = await db.collection("users").where("email", "==", body.userEmail.toLowerCase()).limit(1).get();
    if (targetUserSnapshot.empty) {
      return failure(`No user found with email "${body.userEmail}".`, 404);
    }

    const targetUser = targetUserSnapshot.docs[0].data();
    const targetUserId = targetUser.uid as string;

    if (await userHasActiveTrainAssignment(db, body.trainId, targetUserId)) {
      return failure("This user already has access to this train.", 409);
    }

    const now = FieldValue.serverTimestamp();
    const assignmentData = {
      trainId: body.trainId,
      userId: targetUserId,
      role: body.role,
      grantedBy: user.uid,
      grantedByEmail: user.email,
      grantedAt: now,
      expiresAt: null
    };

    const assignmentRef = await db.collection("trainAssignments").add(assignmentData);

    return ok({ success: true, assignmentId: assignmentRef.id, userEmail: body.userEmail });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0].message, 400);
    }
    return failure(error instanceof Error ? error.message : "Failed to grant access.", 500);
  }
}
