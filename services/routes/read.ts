import "server-only";

import { getFirebaseAdminDb } from "@/services/firebase/admin";
import { getTrain } from "@/services/trains/read";
import { getNumber, getOptionalIsoString, getString } from "@/services/telemetry/derive";
import type { PlannedGeometryPoint, Route, RouteStop, RouteWaypoint } from "@/types/route";
import type { AppUser } from "@/types/user";

type RawRecord = Record<string, unknown>;

function mapStop(raw: unknown, fallbackName: string): RouteStop | null {
  const record = raw as RawRecord | null;
  const lat = getNumber(record?.lat);
  const lng = getNumber(record?.lng);

  if (lat === null || lng === null) {
    return null;
  }

  return {
    name: getString(record?.name) ?? fallbackName,
    lat,
    lng,
    code: getString(record?.code),
    displayName: getString(record?.displayName),
    source:
      record?.source === "openstreetmap"
        ? "openstreetmap"
        : null,
    osmType:
      record?.osmType === "node" || record?.osmType === "way" || record?.osmType === "relation"
        ? record.osmType
        : null,
    osmId: getNumber(record?.osmId)
  };
}

function mapWaypoints(raw: unknown): RouteWaypoint[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((waypoint, index) => {
      const record = waypoint as RawRecord;
      const lat = getNumber(record.lat);
      const lng = getNumber(record.lng);

      if (lat === null || lng === null) {
        return null;
      }

      const mappedWaypoint: RouteWaypoint = {
        id: getString(record.id) ?? `waypoint-${index + 1}`,
        name: getString(record.name) ?? `Waypoint ${index + 1}`,
        lat,
        lng,
        code: getString(record.code) ?? null,
        displayName: getString(record.displayName) ?? null,
        source:
          record.source === "openstreetmap"
            ? "openstreetmap"
            : null,
        osmType:
          record.osmType === "node" || record.osmType === "way" || record.osmType === "relation"
            ? record.osmType
            : null,
        osmId: getNumber(record.osmId) ?? null,
        orderIndex: getNumber(record.orderIndex) ?? index + 1
      };

      return mappedWaypoint;
    })
    .filter((waypoint): waypoint is RouteWaypoint => waypoint !== null)
    .sort((left, right) => left.orderIndex - right.orderIndex);
}

function buildFallbackGeometry(source: RouteStop, waypoints: RouteWaypoint[], destination: RouteStop): PlannedGeometryPoint[] {
  const geometry: PlannedGeometryPoint[] = [
    {
      lat: source.lat,
      lng: source.lng,
      orderIndex: 0,
      kind: "source"
    }
  ];

  waypoints.forEach((waypoint, index) => {
    geometry.push({
      lat: waypoint.lat,
      lng: waypoint.lng,
      orderIndex: index + 1,
      kind: "waypoint"
    });
  });

  geometry.push({
    lat: destination.lat,
    lng: destination.lng,
    orderIndex: geometry.length,
    kind: "destination"
  });

  return geometry;
}

function mapPlannedGeometry(raw: unknown, source: RouteStop, waypoints: RouteWaypoint[], destination: RouteStop) {
  if (!Array.isArray(raw)) {
    return buildFallbackGeometry(source, waypoints, destination);
  }

  const points = raw
    .map((point, index) => {
      const record = point as RawRecord;
      const lat = getNumber(record.lat);
      const lng = getNumber(record.lng);

      if (lat === null || lng === null) {
        return null;
      }

      return {
        lat,
        lng,
        orderIndex: getNumber(record.orderIndex) ?? index,
        kind:
          record.kind === "source" || record.kind === "waypoint" || record.kind === "destination"
            ? record.kind
            : index === 0
              ? "source"
              : "waypoint"
      } satisfies PlannedGeometryPoint;
    })
    .filter((point): point is PlannedGeometryPoint => point !== null)
    .sort((left, right) => left.orderIndex - right.orderIndex);

  return points.length ? points : buildFallbackGeometry(source, waypoints, destination);
}

function mapRoute(trainId: string, raw: RawRecord): Route | null {
  const source = mapStop(raw.source, getString(raw.origin) ?? "Source");
  const destination = mapStop(raw.destinationStop, getString(raw.destination) ?? "Destination");

  if (!source || !destination) {
    return null;
  }

  const waypoints = mapWaypoints(raw.waypoints);

  return {
    id: getString(raw.id) ?? trainId,
    trainId: getString(raw.trainId) ?? trainId,
    name: getString(raw.name) ?? `${source.name} to ${destination.name}`,
    origin: getString(raw.origin) ?? source.name,
    destination: getString(raw.destination) ?? destination.name,
    source,
    destinationStop: destination,
    waypoints,
    plannedGeometry: mapPlannedGeometry(raw.plannedGeometry, source, waypoints, destination),
    geometrySource: raw.geometrySource === "rail-network" ? "rail-network" : "fallback-direct",
    distanceKm: getNumber(raw.distanceKm),
    estimatedDurationMinutes: getNumber(raw.estimatedDurationMinutes),
    createdAt: getOptionalIsoString(raw.createdAt) ?? new Date().toISOString(),
    updatedAt: getOptionalIsoString(raw.updatedAt) ?? new Date().toISOString()
  };
}

export async function getTrainRoute(trainId: string, user?: AppUser): Promise<Route | null> {
  const train = await getTrain(trainId, user);
  if (!train || !process.env.FIREBASE_PROJECT_ID) {
    return null;
  }

  const db = getFirebaseAdminDb();
  const routeDoc = await db.collection("routes").doc(train.routeId ?? train.id).get();

  if (!routeDoc.exists) {
    return null;
  }

  return mapRoute(train.id, routeDoc.data() as RawRecord);
}

export async function listRoutesForTrainIds(trainIds: string[]): Promise<Map<string, Route>> {
  const routes = new Map<string, Route>();

  if (!process.env.FIREBASE_PROJECT_ID || !trainIds.length) {
    return routes;
  }

  const db = getFirebaseAdminDb();
  const docs = await db.getAll(...trainIds.map((trainId) => db.collection("routes").doc(trainId)));

  docs.forEach((doc) => {
    if (!doc.exists) {
      return;
    }

    const route = mapRoute(doc.id, doc.data() as RawRecord);
    if (route) {
      routes.set(doc.id, route);
    }
  });

  return routes;
}
