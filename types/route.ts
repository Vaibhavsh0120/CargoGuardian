export type RouteCoordinate = {
  lat: number;
  lng: number;
};

export type RouteStop = RouteCoordinate & {
  name: string;
  code?: string | null;
  displayName?: string | null;
  source?: "openstreetmap" | null;
  osmType?: "node" | "way" | "relation" | null;
  osmId?: number | null;
};

export type RouteWaypoint = RouteStop & {
  id: string;
  orderIndex: number;
};

export type PlannedGeometryPoint = RouteCoordinate & {
  orderIndex: number;
  kind: "source" | "waypoint" | "destination";
};

export type RouteGeometrySource = "rail-network" | "fallback-direct";

export type Route = {
  id: string;
  trainId: string;
  name: string;
  origin: string;
  destination: string;
  source: RouteStop;
  destinationStop: RouteStop;
  waypoints: RouteWaypoint[];
  plannedGeometry: PlannedGeometryPoint[];
  geometrySource: RouteGeometrySource;
  distanceKm: number | null;
  estimatedDurationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RouteSummary = Pick<Route, "id" | "trainId" | "name" | "origin" | "destination">;

export type RouteWaypointInput = RouteStop;

export type UpsertTrainRouteInput = {
  name: string | null;
  source: RouteStop;
  destination: RouteStop;
  waypoints: RouteWaypointInput[];
};
