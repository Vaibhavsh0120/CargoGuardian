export type Route = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number | null;
  estimatedDurationMinutes: number | null;
  waypoints: RouteWaypoint[];
  createdAt: string;
  updatedAt: string;
};

export type RouteWaypoint = {
  name: string;
  lat: number;
  lng: number;
  orderIndex: number;
};

export type RouteSummary = Pick<Route, "id" | "name" | "origin" | "destination">;
