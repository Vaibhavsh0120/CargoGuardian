import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { canUserReviewAccessRequest, userHasActiveTrainAssignment } from "@/services/trains/access";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const { requestId } = await params;
    const db = getFirebaseAdminDb();

    const requestDoc = await db.collection("accessRequests").doc(requestId).get();
    if (!requestDoc.exists) {
      return failure("Request not found.", 404);
    }

    const requestData = requestDoc.data();
    if (!requestData) {
      return failure("Request data unavailable.", 500);
    }

    if (requestData.status !== "pending") {
      return failure("Request is no longer pending.", 400);
    }

    const canReview = await canUserReviewAccessRequest(db, user, requestData);
    if (!canReview) {
      return failure("You are not allowed to approve this request.", 403);
    }

    if (await userHasActiveTrainAssignment(db, requestData.trainId as string, requestData.userId as string)) {
      return failure("This user already has active access to the train.", 409);
    }

    const now = FieldValue.serverTimestamp();

    await db.collection("accessRequests").doc(requestId).update({
      status: "approved",
      reviewedBy: user.uid,
      reviewedAt: now
    });

    await db.collection("trainAssignments").add({
      trainId: requestData.trainId,
      userId: requestData.userId,
      role: requestData.role,
      grantedBy: user.uid,
      grantedByEmail: user.email,
      grantedAt: now,
      expiresAt: null
    });

    return ok({ success: true });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to approve request.", 500);
  }
}
