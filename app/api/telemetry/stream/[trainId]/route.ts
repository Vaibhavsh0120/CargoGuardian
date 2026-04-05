import { failure } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { createTelemetryStreamResponse } from "@/services/telemetry/stream";

export async function GET(_request: Request, { params }: { params: Promise<{ trainId: string }> }) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const { trainId } = await params;
  const response = await createTelemetryStreamResponse(trainId, user);

  if (!response) {
    return failure("Train not found.", 404);
  }

  return response;
}
