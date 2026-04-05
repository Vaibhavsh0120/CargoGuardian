import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDashboardOperationsData } from "@/services/dashboard/read";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const data = await getDashboardOperationsData(user);
  return ok(data);
}
