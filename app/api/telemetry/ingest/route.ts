import { z } from "zod";

import { ok, failure } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import { telemetryIngestSchema } from "@/lib/validation/telemetry";
import {
  TelemetryTrainNotFoundError,
  ingestTelemetryFromBlynk,
  buildBlynkWebhookPayload
} from "@/services/telemetry/ingest";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const webhookSecret = process.env.BLYNK_WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      logger.warn("Rejected Blynk webhook with invalid Authorization header.");
      return failure("Unauthorized", 401);
    }

    const body = telemetryIngestSchema.parse(await request.json());

    const payload = buildBlynkWebhookPayload(body.deviceId, {
      weightKg: body.weightKg,
      gpsLat: body.gpsLat,
      gpsLng: body.gpsLng,
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
      logger.warn("Rejected Blynk webhook payload.", error.issues);
      return failure(error.issues[0].message, 400);
    }
    if (error instanceof TelemetryTrainNotFoundError) {
      logger.warn(error.message);
      return failure(error.message, 404);
    }
    logger.error("Blynk telemetry ingest failed.", error);
    return failure(error instanceof Error ? error.message : "Failed to ingest telemetry.", 500);
  }
}
