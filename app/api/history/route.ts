import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { listOperationalEvents } from "@/services/history/read";

export async function GET(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const url = new URL(request.url);
  const trainId = url.searchParams.get("trainId") ?? undefined;
  const category = url.searchParams.get("category") as "access" | "alert" | "clearance" | "telemetry" | "all" | null;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 50;

  const history = await listOperationalEvents(
    {
      trainId,
      category: category ?? "all",
      limit: Number.isFinite(limit) ? limit : 50
    },
    user
  );

  return ok(history);
}
