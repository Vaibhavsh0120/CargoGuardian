import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import type { UpsertTrainRoutePayload } from "@/lib/validation/routes";
import { getFirebaseAdminDb } from "@/services/firebase/admin";
import {
  buildRailRouteGeometry,
  RailRouteGeometryError
} from "@/services/routes/rail-geometry";
import { getTrain } from "@/services/trains/read";
import { getOptionalIsoString } from "@/services/telemetry/derive";
import type { PlannedGeometryPoint, Route, RouteStop, RouteWaypoint } from "@/types/route";
import type { AppUser } from "@/types/user";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistanceKm(start: Pick<RouteStop, "lat" | "lng">, end: Pick<RouteStop, "lat" | "lng">) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(start.lat)) * Math.cos(toRadians(end.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildWaypoints(trainId: string, input: UpsertTrainRoutePayload["waypoints"]): RouteWaypoint[] {
  return input.map((waypoint, index) => ({
    id: `${trainId}-waypoint-${index + 1}`,
    name: waypoint.name,
    code: waypoint.code ?? null,
    displayName: waypoint.displayName ?? null,
    lat: waypoint.lat,
    lng: waypoint.lng,
    source: waypoint.source ?? "openstreetmap",
    osmType: waypoint.osmType ?? null,
    osmId: waypoint.osmId ?? null,
    orderIndex: index + 1
  }));
}

function calculateDistanceKmFromGeometry(points: PlannedGeometryPoint[]) {
  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    total += haversineDistanceKm(points[index - 1], points[index]);
  }

  return Number(total.toFixed(2));
}

function estimateDurationMinutes(distanceKm: number, maxSpeed: number | null) {
  if (!maxSpeed || maxSpeed <= 0) {
    return null;
  }

  return Math.max(1, Math.round((distanceKm / maxSpeed) * 60));
}

function assertCanManageRoute(user: AppUser | undefined) {
  if (!user || (user.role !== "admin" && user.role !== "master")) {
    throw new RouteWritePermissionError();
  }
}

export async function upsertTrainRoute(
  trainId: string,
  input: UpsertTrainRoutePayload,
  user?: AppUser
): Promise<Route> {
  assertCanManageRoute(user);

  const train = await getTrain(trainId, user);
  if (!train) {
    throw new RouteTrainNotFoundError(trainId);
  }

  const db = getFirebaseAdminDb();
  const routeRef = db.collection("routes").doc(train.id);
  const existingDoc = await routeRef.get();
  const now = FieldValue.serverTimestamp();
  const routeName = input.name ?? `${input.source.name} to ${input.destination.name}`;
  const waypoints = buildWaypoints(train.id, input.waypoints);
  const plannedGeometry = await buildRailRouteGeometry([input.source, ...waypoints, input.destination]);
  const distanceKm = calculateDistanceKmFromGeometry(plannedGeometry);
  const estimatedDurationMinutes = estimateDurationMinutes(distanceKm, train.maxSpeed);

  await routeRef.set({
    id: train.id,
    trainId: train.id,
    name: routeName,
    origin: input.source.name,
    destination: input.destination.name,
    source: input.source,
    destinationStop: input.destination,
    waypoints,
    plannedGeometry,
    geometrySource: "rail-network",
    distanceKm,
    estimatedDurationMinutes,
    createdAt: existingDoc.exists ? existingDoc.data()?.createdAt ?? now : now,
    updatedAt: now
  });

  await db.collection("trains").doc(train.id).set(
    {
      routeId: train.id,
      routeName,
      origin: input.source.name,
      destination: input.destination.name,
      updatedAt: now
    },
    { merge: true }
  );

  const timestamp = new Date().toISOString();

  return {
    id: train.id,
    trainId: train.id,
    name: routeName,
    origin: input.source.name,
    destination: input.destination.name,
    source: input.source,
    destinationStop: input.destination,
    waypoints,
    plannedGeometry,
    geometrySource: "rail-network",
    distanceKm,
    estimatedDurationMinutes,
    createdAt: getOptionalIsoString(existingDoc.data()?.createdAt) ?? timestamp,
    updatedAt: timestamp
  };
}

export class RouteWritePermissionError extends Error {
  constructor() {
    super("Only administrators and masters can update train routes.");
    this.name = "RouteWritePermissionError";
  }
}

export class RouteTrainNotFoundError extends Error {
  constructor(trainId: string) {
    super(`Train "${trainId}" was not found.`);
    this.name = "RouteTrainNotFoundError";
  }
}

export { RailRouteGeometryError };
