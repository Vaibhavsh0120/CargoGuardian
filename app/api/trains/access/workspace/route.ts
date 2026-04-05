import { ok, failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getAccessWorkspaceForUser } from "@/services/access/read";

export async function GET() {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return failure("Unauthorized", 401);
    }

    return ok(await getAccessWorkspaceForUser(user));
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to load access workspace.", 500);
  }
}
