import "server-only";

import { getCurrentTelemetry } from "@/services/telemetry/read";
import type { TelemetryStreamEvent } from "@/types/telemetry";
import type { AppUser } from "@/types/user";

const STREAM_INTERVAL_MS = 15_000;

export async function createTelemetryStreamResponse(trainId: string, user: AppUser): Promise<Response | null> {
  if (!(await getCurrentTelemetry(trainId, user))) {
    return null;
  }

  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const sendSnapshot = async () => {
        const snapshot = await getCurrentTelemetry(trainId, user);
        if (!snapshot) {
          controller.close();
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          return;
        }

        const payload: TelemetryStreamEvent = {
          snapshot,
          sentAt: new Date().toISOString()
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      controller.enqueue(encoder.encode("retry: 10000\n\n"));
      void sendSnapshot();

      intervalId = setInterval(() => {
        void sendSnapshot();
      }, STREAM_INTERVAL_MS);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}
