import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const grantAccessSchema = z.object({
  trainId: z.string(),
  email: z.string().email(),
  role: z.enum(["worker", "master"])
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    if (user.role === "worker") {
      return failure("Workers cannot grant access.", 403);
    }

    const body = grantAccessSchema.parse(await request.json());
    const db = getFirebaseAdminDb();

    // Verify train exists and user has rights to grant access.
    const trainDoc = await db.collection("trains").doc(body.trainId).get();
    if (!trainDoc.exists) {
      return failure("Train not found", 404);
    }

    if (user.role !== "admin") {
      const trainData = trainDoc.data();
      if (!trainData) {
        return failure("Train data unavailable.", 500);
      }
      if (trainData.ownerId !== user.uid) {
        // Look up assignment
        const assignments = await db
          .collection("trainAssignments")
          .where("trainId", "==", body.trainId)
          .where("userId", "==", user.uid)
          .where("role", "==", "master")
          .get();

        if (assignments.empty) {
          return failure("You do not have Train Master privileges for this train.", 403);
        }
      }
    }

    // Lookup the target user by email
    const targetSnapshot = await db.collection("users").where("email", "==", body.email).limit(1).get();
    if (targetSnapshot.empty) {
      return failure("User account with that email not found. They must register first.", 404);
    }
    const targetUserId = targetSnapshot.docs[0].id;

    const assignmentId = `${body.trainId}_${targetUserId}`;

    await db.collection("trainAssignments").doc(assignmentId).set({
      trainId: body.trainId,
      userId: targetUserId,
      role: body.role,
      grantedBy: user.uid,
      grantedAt: FieldValue.serverTimestamp(),
      expiresAt: null
    });

    return ok({ success: true, assignmentId });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to grant access.", 500);
  }
}

const revokeAccessSchema = z.object({
  trainId: z.string(),
  userId: z.string()
});

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const body = revokeAccessSchema.parse(await request.json());
    
    // A user can revoke their own access.
    // Master can revoke worker.
    // Admin can revoke anyone.

    const db = getFirebaseAdminDb();

    if (user.uid !== body.userId && user.role !== "admin") {
      // Need to verify they are a master for this train
      const assignments = await db
        .collection("trainAssignments")
        .where("trainId", "==", body.trainId)
        .where("userId", "==", user.uid)
        .where("role", "==", "master")
        .get();

      const trainDoc = await db.collection("trains").doc(body.trainId).get();
      if (!trainDoc.exists) {
        return failure("Train not found", 404);
      }
      
      const trainData = trainDoc.data();
      if (!trainData) {
        return failure("Train data unavailable.", 500);
      }
      if (assignments.empty && trainData.ownerId !== user.uid) {
        return failure("You do not have privileges to revoke access for this train.", 403);
      }
    }

    const assignmentId = `${body.trainId}_${body.userId}`;
    await db.collection("trainAssignments").doc(assignmentId).delete();

    return ok({ success: true });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to revoke access.", 500);
  }
}
