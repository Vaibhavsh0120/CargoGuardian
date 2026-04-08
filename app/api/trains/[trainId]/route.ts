import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { getTrain } from "@/services/trains/read";
import {
  TrainDeleteNotFoundError,
  TrainDeletePermissionError,
  deleteTrain
} from "@/services/trains/write";

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

export async function DELETE(_request: Request, { params }: { params: Promise<{ trainId: string }> }) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  const { trainId } = await params;

  try {
    await deleteTrain(trainId, user);
    return ok({ success: true, trainId });
  } catch (error) {
    if (error instanceof TrainDeletePermissionError) {
      return failure(error.message, 403);
    }

    if (error instanceof TrainDeleteNotFoundError) {
      return failure(error.message, 404);
    }

    throw error;
  }
}
