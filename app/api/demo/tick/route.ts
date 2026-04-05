import { failure, ok } from "@/lib/api/response";
import { getCurrentSessionUser } from "@/lib/auth/session";
import {
  getDemoControlState,
  saveDemoSimulationState
} from "@/services/demo/control";
import {
  advanceDemoSimulationState,
  createInitialDemoSimulationState,
  publishDemoStateToBlynk
} from "@/services/demo/simulator";

export const runtime = "nodejs";

function ensureDemoModeEnabled() {
  return Boolean(process.env.DEMO_BLYNK_AUTH_TOKEN);
}

export async function POST() {
  try {
    const user = await getCurrentSessionUser();

    if (!user) {
      return failure("Authentication required.", 401);
    }

    if (!ensureDemoModeEnabled()) {
      return failure("Demo device is not configured.", 409);
    }

    const control = await getDemoControlState();

    if (control.runtimeStatus !== "running") {
      return ok({
        runtimeStatus: "stopped",
        published: false
      });
    }

    const currentState = control.simulationState ?? createInitialDemoSimulationState();
    const nextState = advanceDemoSimulationState(currentState, control.weightWarningState);

    await publishDemoStateToBlynk(nextState);
    await saveDemoSimulationState(nextState, user, "running");

    return ok({
      runtimeStatus: "running",
      published: true,
      state: {
        weightKg: nextState.weightKg,
        gpsLat: nextState.gpsLat,
        gpsLng: nextState.gpsLng,
        signalStrength: nextState.signalStrength,
        weightWarningState: nextState.weightWarningState
      }
    });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Failed to publish demo telemetry to Blynk.", 502);
  }
}
