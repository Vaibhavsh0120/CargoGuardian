import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { searchRailwayStations } from "@/services/stations/search";

export async function GET(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 10)) : 8;

  if (query.length < 2) {
    return ok({
      stations: [],
      fetchedAt: new Date().toISOString()
    });
  }

  return ok(await searchRailwayStations(query, limit));
}
