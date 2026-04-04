import { z } from "zod";

import { CARGO_TYPE_VALUES, TRAIN_STATUS_VALUES } from "@/types/train";

// Create train schema
export const createTrainSchema = z.object({
  code: z
    .string()
    .min(2, "Train code must be at least 2 characters.")
    .max(20, "Train code must be at most 20 characters.")
    .regex(/^[A-Za-z0-9-]+$/, "Train code may only contain letters, digits, and hyphens."),
  label: z
    .string()
    .min(3, "Train name must be at least 3 characters.")
    .max(100, "Train name must be at most 100 characters."),
  cargoType: z.enum(CARGO_TYPE_VALUES),
  carCount: z.coerce
    .number()
    .int("Car count must be a whole number.")
    .min(1, "At least 1 car is required.")
    .max(300, "Car count cannot exceed 300."),
  maxSpeed: z.coerce
    .number()
    .min(0, "Speed cannot be negative.")
    .max(500, "Max speed cannot exceed 500 km/h.")
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  origin: z
    .string()
    .max(120)
    .nullable()
    .optional()
    .transform((value) => value?.trim() || null),
  destination: z
    .string()
    .max(120)
    .nullable()
    .optional()
    .transform((value) => value?.trim() || null),
  routeId: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  description: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .transform((value) => value?.trim() || null),
  blynkAuthToken: z
    .string()
    .min(8, "Blynk Auth Token is required.")
    .max(255, "Blynk Auth Token is too long."),
  blynkDeviceId: z
    .string()
    .max(255)
    .nullable()
    .optional()
    .transform((value) => value?.trim() || null)
});

export type CreateTrainPayload = z.infer<typeof createTrainSchema>;

// Query params
export const trainListQuerySchema = z.object({
  status: z.enum(TRAIN_STATUS_VALUES).optional(),
  search: z.string().max(100).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50),
  sortBy: z.enum(["label", "code", "status", "updatedAt"]).default("label"),
  sortDir: z.enum(["asc", "desc"]).default("asc")
});

export type TrainListQuery = z.infer<typeof trainListQuerySchema>;
