import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { telemetryCurrentListQuerySchema } from "@/lib/validation/telemetry";
import { listCurrentTelemetry } from "@/services/telemetry/read";

export async function GET(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const parsed = telemetryCurrentListQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined
  });

  if (!parsed.success) {
    return failure("Invalid query parameters.", 400);
  }

  const telemetry = await listCurrentTelemetry(parsed.data.limit, user);
  return ok(telemetry);
}
