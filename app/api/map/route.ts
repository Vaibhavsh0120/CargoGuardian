import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getMapWorkspace } from "@/services/map/read";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  return ok(await getMapWorkspace(user));
}
