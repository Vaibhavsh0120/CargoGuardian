import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { resolveAlertById } from "@/services/alerts/write";

export async function POST(_request: Request, { params }: { params: Promise<{ alertId: string }> }) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  if (user.role !== "admin" && user.role !== "master") {
    return failure("Only admins and masters can resolve alerts.", 403);
  }

  const { alertId } = await params;
  const alert = await resolveAlertById(alertId, {
    actorId: user.uid,
    actorLabel: user.displayName ?? user.email ?? "Operator",
    actorRole: user.role
  });

  if (!alert) {
    return failure("Alert not found.", 404);
  }

  return ok({ alert, success: true });
}
