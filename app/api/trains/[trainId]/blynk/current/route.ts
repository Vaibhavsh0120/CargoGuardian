import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getTrainBlynkSnapshot } from "@/services/blynk/device";
import { getTrain } from "@/services/trains/read";

export async function GET(_request: Request, { params }: { params: Promise<{ trainId: string }> }) {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return failure("Authentication required.", 401);
    }

    const { trainId } = await params;
    const train = await getTrain(trainId, user);

    if (!train) {
      return failure("Train not found.", 404);
    }

    if (!train.blynkAuthToken) {
      return failure("This train is missing its Blynk Auth Token.", 409);
    }

    const snapshot = await getTrainBlynkSnapshot(train);
    return ok(snapshot);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to read device state from Blynk.", 502);
  }
}
