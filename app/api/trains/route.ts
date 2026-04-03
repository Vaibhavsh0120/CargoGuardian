import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import { listTrainSelectorItems } from "@/services/trains/train-selector";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  return ok(await listTrainSelectorItems());
}
