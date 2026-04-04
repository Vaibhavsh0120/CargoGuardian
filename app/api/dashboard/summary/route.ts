import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getDashboardSummary } from "@/services/dashboard/summary";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const summary = await getDashboardSummary(user);
  return ok({ summary, fetchedAt: new Date().toISOString() });
}
