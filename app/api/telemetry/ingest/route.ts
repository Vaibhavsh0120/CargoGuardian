import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { ingestTelemetryFromBlynk, buildBlynkWebhookPayload } from "@/services/telemetry/ingest";

const telemetryIngestSchema = z.object({
  deviceId: z.string().min(1),
  weightKg: z.number().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional(),
  speedKmh: z.number().optional(),
  clearanceLed: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  errorLed: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  weightWarningState: z.union([z.literal(-1), z.literal(0), z.literal(1)]).optional(),
  weightWarningLightColor: z.enum(["off", "orange", "red"]).optional(),
  rfidLastScan: z.string().optional(),
  rfidLastTag: z.string().optional(),
  trainPower: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  signalStrength: z.number().optional()
});

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const webhookSecret = process.env.BLYNK_WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return failure("Unauthorized", 401);
    }

    const body = telemetryIngestSchema.parse(await request.json());

    const payload = buildBlynkWebhookPayload(body.deviceId, {
      weightKg: body.weightKg ?? 0,
      gpsLat: body.gpsLat ?? 0,
      gpsLng: body.gpsLng ?? 0,
      speedKmh: body.speedKmh,
      clearanceLed: body.clearanceLed ?? false,
      errorLed: body.errorLed,
      weightWarningState: body.weightWarningState,
      weightWarningLightColor: body.weightWarningLightColor,
      rfidLastScan: body.rfidLastScan,
      rfidLastTag: body.rfidLastTag,
      trainPower: body.trainPower ?? true,
      signalStrength: body.signalStrength
    });

    await ingestTelemetryFromBlynk(payload);

    return ok({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure(error.issues[0].message, 400);
    }
    return failure(error instanceof Error ? error.message : "Failed to ingest telemetry.", 500);
  }
}
