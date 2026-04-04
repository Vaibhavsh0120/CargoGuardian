import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { canUserReviewAccessRequest } from "@/services/trains/access";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const db = getFirebaseAdminDb();

    const snapshot =
      user.role === "admin" || user.role === "master"
        ? await db.collection("accessRequests").where("status", "==", "pending").orderBy("requestedAt", "desc").get()
        : await db.collection("accessRequests").where("userId", "==", user.uid).orderBy("requestedAt", "desc").get();

    const mappedRequests = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        trainId: data.trainId as string,
        trainCode: data.trainCode ?? null,
        userId: data.userId as string,
        userEmail: data.userEmail as string,
        userName: (data.userName as string) ?? null,
        userRole: data.role as string,
        reason: (data.reason as string) ?? null,
        status: data.status as string,
        requestedAt: normalizeTimestamp(data.requestedAt),
        reviewedAt: normalizeTimestamp(data.reviewedAt),
        reviewedBy: (data.reviewedBy as string) ?? null
      };
    });

    const requests =
      user.role === "master"
        ? (
            await Promise.all(
              snapshot.docs.map(async (doc, index) =>
                (await canUserReviewAccessRequest(db, user, doc.data())) ? mappedRequests[index] : null
              )
            )
          ).filter((request): request is (typeof mappedRequests)[number] => Boolean(request))
        : mappedRequests;

    return ok({ requests, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to fetch requests.", 500);
  }
}

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}
