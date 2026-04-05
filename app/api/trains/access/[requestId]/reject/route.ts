import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { recordOperationalEvent } from "@/services/events/write";
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

    const trainDoc = await db.collection("trains").doc(requestData.trainId as string).get();
    const trainData = trainDoc.data() as Record<string, unknown> | undefined;

    await recordOperationalEvent({
      category: "access",
      action: "access-rejected",
      title: "Access rejected",
      description: `${user.displayName ?? user.email ?? "Operator"} rejected access for ${String(requestData.userEmail ?? requestData.userId)}.`,
      trainId: requestData.trainId as string,
      trainCode: typeof trainData?.code === "string" ? trainData.code : (requestData.trainCode as string | undefined) ?? null,
      trainLabel:
        typeof trainData?.label === "string"
          ? trainData.label
          : typeof trainData?.code === "string"
            ? trainData.code
            : ((requestData.trainCode as string | undefined) ?? null),
      actorId: user.uid,
      actorLabel: user.displayName ?? user.email ?? "Operator",
      actorRole: user.role,
      metadata: {
        requestedUserEmail: (requestData.userEmail as string | undefined) ?? null,
        rejectionReason: body.reason ?? null
      }
    });

    return ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0].message, 400);
    }
    return failure(error instanceof Error ? error.message : "Failed to reject request.", 500);
  }
}
