import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getTrain } from "@/services/trains/read";

export async function GET(_request: Request, { params }: { params: Promise<{ trainId: string }> }) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const { trainId } = await params;
  const train = await getTrain(trainId, user);

  if (!train) {
    return failure("Train not found.", 404);
  }

  return ok(train);
}
