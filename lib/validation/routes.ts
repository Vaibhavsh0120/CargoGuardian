import { z } from "zod";

const coordinateSchema = z.object({
  lat: z.coerce.number().min(-90, "Latitude must be at least -90.").max(90, "Latitude must be at most 90."),
  lng: z.coerce.number().min(-180, "Longitude must be at least -180.").max(180, "Longitude must be at most 180.")
});

const routeStopSchema = coordinateSchema.extend({
  name: z.string().trim().min(2, "Location name must be at least 2 characters.").max(120, "Location name is too long."),
  code: z
    .string()
    .trim()
    .max(24, "Station code is too long.")
    .nullable()
    .optional()
    .transform((value) => value || null),
  displayName: z
    .string()
    .trim()
    .max(180, "Station display name is too long.")
    .nullable()
    .optional()
    .transform((value) => value || null),
  source: z.enum(["openstreetmap"]).nullable().optional().default("openstreetmap"),
  osmType: z.enum(["node", "way", "relation"]).nullable().optional().default(null),
  osmId: z.coerce.number().int().positive().nullable().optional().default(null)
});

export const upsertTrainRouteSchema = z.object({
  name: z
    .string()
    .trim()
    .max(140, "Route name is too long.")
    .nullable()
    .optional()
    .transform((value) => value || null),
  source: routeStopSchema,
  destination: routeStopSchema,
  waypoints: z.array(routeStopSchema).max(8, "A route can include at most 8 waypoints.").default([])
});

export type UpsertTrainRoutePayload = z.infer<typeof upsertTrainRouteSchema>;
