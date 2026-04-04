import "server-only";

import type { AppUser } from "@/types/user";
import { getTrainSummary } from "@/services/trains/read";
import type { TrainSummary } from "@/types/train";

export async function getDashboardSummary(user?: AppUser): Promise<TrainSummary> {
  return getTrainSummary(user);
}
