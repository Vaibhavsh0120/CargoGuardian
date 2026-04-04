import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import type { TrainAssignment } from "@/types/user";

function normalizeTimestamp(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const db = getFirebaseAdminDb();
    const snapshot = await db.collection("trainAssignments").where("userId", "==", user.uid).get();

    const assignments: TrainAssignment[] = snapshot.docs
      .filter((doc) => !doc.data().revokedAt)
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          trainId: data.trainId as string,
          userId: data.userId as string,
          role: data.role as TrainAssignment["role"],
          grantedBy: data.grantedBy as string,
          grantedAt: normalizeTimestamp(data.grantedAt) ?? new Date().toISOString(),
          expiresAt: normalizeTimestamp(data.expiresAt)
        };
      });

    return ok({ assignments });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to fetch assignments.", 500);
  }
}
