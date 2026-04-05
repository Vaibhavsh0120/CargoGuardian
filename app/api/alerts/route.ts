import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { listAlerts } from "@/services/alerts/read";

export async function GET(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const url = new URL(request.url);
  const trainId = url.searchParams.get("trainId") ?? undefined;
  const status = url.searchParams.get("status") as "open" | "acknowledged" | "resolved" | "active" | "all" | null;
  const severity = url.searchParams.get("severity") as "low" | "medium" | "high" | "critical" | "all" | null;
  const type = url.searchParams.get("type") as
    | "overweight"
    | "underweight"
    | "offline"
    | "transit-weight-change"
    | "all"
    | null;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 50;

  const alerts = await listAlerts(
    {
      trainId,
      status: status ?? "all",
      severity: severity ?? "all",
      type: type ?? "all",
      limit: Number.isFinite(limit) ? limit : 50
    },
    user
  );

  return ok(alerts);
}
