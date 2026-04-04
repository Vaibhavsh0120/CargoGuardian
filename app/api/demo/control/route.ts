import { z } from "zod";

import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import {
  getDemoWeightWarningState,
  setDemoWeightWarningState,
  type DemoWeightWarningState
} from "@/services/demo/control";

const demoControlSchema = z.object({
  weightWarningState: z.union([z.literal(-1), z.literal(0), z.literal(1)])
});

function ensureDemoModeEnabled() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  if (!ensureDemoModeEnabled()) {
    return failure("Demo mode is disabled.", 409);
  }

  const weightWarningState = await getDemoWeightWarningState();
  return ok({ weightWarningState });
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  if (!ensureDemoModeEnabled()) {
    return failure("Demo mode is disabled.", 409);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid JSON body.", 400);
  }

  const parsed = demoControlSchema.safeParse(body);
  if (!parsed.success) {
    return failure("weightWarningState must be -1, 0, or 1.", 422);
  }

  await setDemoWeightWarningState(parsed.data.weightWarningState as DemoWeightWarningState, user);

  return ok({
    weightWarningState: parsed.data.weightWarningState,
    message: `Demo weightWarningState set to ${parsed.data.weightWarningState}.`
  });
}
