import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getCurrentTelemetry } from "@/services/telemetry/read";

export async function GET(_request: Request, { params }: { params: Promise<{ trainId: string }> }) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const { trainId } = await params;
  const telemetry = await getCurrentTelemetry(trainId, user);

  if (!telemetry) {
    return failure("Train not found.", 404);
  }

  return ok({
    telemetry,
    fetchedAt: new Date().toISOString()
  });
}
