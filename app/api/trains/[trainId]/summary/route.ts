import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getTrain, getTrainSummary } from "@/services/trains/read";

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

  const fleetSummary = await getTrainSummary(user);

  return ok({
    train: {
      id: train.id,
      code: train.code,
      label: train.label,
      status: train.status,
      clearanceStatus: train.clearanceStatus,
      journeyStage: train.journeyStage,
      weightStatus: train.weightStatus,
      blynkProvisioningStatus: train.blynkProvisioningStatus,
      blynkTemplateName: train.blynkTemplateName,
      cargoType: train.cargoType,
      origin: train.origin,
      destination: train.destination,
      routeName: train.routeName
    },
    fleetSummary
  });
}
