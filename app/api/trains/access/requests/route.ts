import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { listAccessRequestsForUser } from "@/services/access/read";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    const requests = await listAccessRequestsForUser(user);

    return ok({ requests, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to fetch requests.", 500);
  }
}
