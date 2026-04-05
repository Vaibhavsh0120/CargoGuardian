import { z } from "zod";

import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import {
  getDemoControlState,
  startDemoSimulation,
  stopDemoSimulation,
  setDemoWeightWarningState,
  type DemoWeightWarningState
} from "@/services/demo/control";

export const runtime = "nodejs";

const demoControlSchema = z.union([
  z.object({
    command: z.literal("start")
  }),
  z.object({
    command: z.literal("stop")
  }),
  z.object({
    weightWarningState: z.union([z.literal(-1), z.literal(0), z.literal(1)])
  })
]);

function ensureDemoModeEnabled() {
  return Boolean(process.env.DEMO_BLYNK_AUTH_TOKEN);
}

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  if (!ensureDemoModeEnabled()) {
    return failure("Demo device is not configured.", 409);
  }

  const control = await getDemoControlState();
  return ok(control);
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();

  if (!user) {
    return failure("Authentication required.", 401);
  }

  if (!ensureDemoModeEnabled()) {
    return failure("Demo device is not configured.", 409);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid JSON body.", 400);
  }

  const parsed = demoControlSchema.safeParse(body);
  if (!parsed.success) {
    return failure("Use command start/stop or weightWarningState -1/0/1.", 422);
  }

  if ("command" in parsed.data) {
    if (parsed.data.command === "start") {
      await startDemoSimulation(user);
      return ok({
        runtimeStatus: "running",
        weightWarningState: 0,
        message: "Demo simulation started."
      });
    }

    await stopDemoSimulation(user);
    return ok({
      runtimeStatus: "stopped",
      message: "Demo simulation stopped."
    });
  }

  await setDemoWeightWarningState(parsed.data.weightWarningState as DemoWeightWarningState, user);

  return ok({
    weightWarningState: parsed.data.weightWarningState,
    message: `Demo weightWarningState set to ${parsed.data.weightWarningState}.`
  });
}
