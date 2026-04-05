import { z } from "zod";

const numberLikeSchema = z.union([z.number(), z.string(), z.null()]);
const booleanLikeSchema = z.union([z.boolean(), z.literal(0), z.literal(1), z.string(), z.null()]);

export const telemetryIngestSchema = z.object({
  deviceId: z.string().min(1),
  weightKg: numberLikeSchema.optional(),
  gpsLat: numberLikeSchema.optional(),
  gpsLng: numberLikeSchema.optional(),
  speedKmh: numberLikeSchema.optional(),
  clearanceLed: booleanLikeSchema.optional(),
  errorLed: booleanLikeSchema.optional(),
  weightWarningState: z.union([z.literal(-1), z.literal(0), z.literal(1), z.string(), z.null()]).optional(),
  weightWarningLightColor: z.enum(["off", "orange", "red"]).optional(),
  rfidLastScan: z.union([z.string(), z.null()]).optional(),
  rfidLastTag: z.union([z.string(), z.null()]).optional(),
  trainPower: booleanLikeSchema.optional(),
  signalStrength: numberLikeSchema.optional()
});

export const telemetryCurrentListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(8)
});

export const telemetryHistoryQuerySchema = z.object({
  trainId: z.string().min(1, "trainId is required."),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(240)
    .default(24)
});

export type TelemetryCurrentListQuery = z.infer<typeof telemetryCurrentListQuerySchema>;
export type TelemetryHistoryQuery = z.infer<typeof telemetryHistoryQuerySchema>;
