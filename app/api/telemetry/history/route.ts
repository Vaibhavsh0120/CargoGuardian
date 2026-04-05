import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { telemetryHistoryQuerySchema } from "@/lib/validation/telemetry";
import { getTelemetryHistory } from "@/services/telemetry/read";

export async function GET(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const parsed = telemetryHistoryQuerySchema.safeParse({
    trainId: searchParams.get("trainId") ?? undefined,
    limit: searchParams.get("limit") ?? undefined
  });

  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Invalid query parameters.", 400);
  }

  const history = await getTelemetryHistory(parsed.data.trainId, parsed.data.limit, user);

  if (!history) {
    return failure("Train not found.", 404);
  }

  return ok(history);
}
