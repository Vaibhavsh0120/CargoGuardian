import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { canUserReviewAccessRequest } from "@/services/trains/access";
import { FieldValue } from "firebase-admin/firestore";

const rejectSchema = z.object({
  reason: z.string().max(500).optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const { requestId } = await params;
    const body = rejectSchema.parse(await request.json());
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
      return failure("You are not allowed to reject this request.", 403);
    }

    const now = FieldValue.serverTimestamp();

    await db.collection("accessRequests").doc(requestId).update({
      status: "rejected",
      reviewedBy: user.uid,
      reviewedAt: now,
      rejectionReason: body.reason ?? null
    });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0].message, 400);
    }
    return failure(error instanceof Error ? error.message : "Failed to reject request.", 500);
  }
}
