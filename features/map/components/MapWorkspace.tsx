"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { Route as NextRoute } from "next";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, MapPinned, Navigation, Route as RouteIcon, Save, TrainFront } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { MapCanvasSkeleton, MapPageSkeleton } from "@/components/states/PageSkeletons";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useSession } from "@/features/auth/hooks/useSession";
import { RailwayStationField } from "@/features/map/components/RailwayStationField";
import { fetchMapWorkspace, updateTrainRouteRequest } from "@/features/map/services/map-client";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { cn } from "@/lib/utils";
import type { MapTrainRecord } from "@/types/map";
import type { RouteStop, UpsertTrainRouteInput } from "@/types/route";
import type { RailwayStation } from "@/types/station";

const OperationsMap = dynamic(() => import("@/features/map/components/OperationsMap"), {
  ssr: false,
  loading: () => <MapCanvasSkeleton />
});

type StationFieldState = {
  query: string;
  station: RailwayStation | null;
};

type RouteFormState = {
  routeName: string;
  source: StationFieldState;
  destination: StationFieldState;
  waypoints: StationFieldState[];
};

const EMPTY_FORM: RouteFormState = {
  routeName: "",
  source: {
    query: "",
    station: null
  },
  destination: {
    query: "",
    station: null
  },
  waypoints: []
};

function routeStopToStation(stop: RouteStop | null | undefined): RailwayStation | null {
  if (!stop) {
    return null;
  }

  return {
    id:
      stop.osmType && stop.osmId
        ? `${stop.osmType}:${stop.osmId}`
        : `legacy:${stop.name}:${stop.lat.toFixed(4)}:${stop.lng.toFixed(4)}`,
    code: stop.code ?? null,
    name: stop.name,
    displayName: stop.displayName ?? (stop.code ? `${stop.name} (${stop.code})` : stop.name),
    lat: stop.lat,
    lng: stop.lng,
    source: "openstreetmap",
    osmType: stop.osmType ?? "node",
    osmId: stop.osmId ?? 0,
    kind: "station"
  };
}

function createStationFieldState(station: RailwayStation | null): StationFieldState {
  return {
    query: station?.displayName ?? "",
    station
  };
}

function buildFormState(record: MapTrainRecord | null): RouteFormState {
  if (!record) {
    return EMPTY_FORM;
  }

  return {
    routeName: record.route?.name ?? record.train.routeName ?? "",
    source: createStationFieldState(routeStopToStation(record.route?.source)),
    destination: createStationFieldState(routeStopToStation(record.route?.destinationStop)),
    waypoints: record.route?.waypoints.map((waypoint) => createStationFieldState(routeStopToStation(waypoint))) ?? []
  };
}

function formatLocation(lat: number | null, lng: number | null) {
  if (lat === null || lng === null) {
    return "No live GPS fix";
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function MapWorkspace() {
  const queryClient = useQueryClient();
  const sessionQuery = useSession();
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState<RouteFormState>(EMPTY_FORM);
  const [tileError, setTileError] = useState(false);
  const mapQuery = useQuery({
    queryKey: ["map", "workspace"],
    queryFn: fetchMapWorkspace,
    staleTime: 15_000
  });

  useLiveRefresh({
    queryKeys: [["map", "workspace"]],
    enabled: true
  });

  const selectedRecord = useMemo(
    () => mapQuery.data?.trains.find((train) => train.train.id === selectedTrainId) ?? mapQuery.data?.trains[0] ?? null,
    [mapQuery.data?.trains, selectedTrainId]
  );
  const canEditRoute = sessionQuery.data?.user?.role === "admin" || sessionQuery.data?.user?.role === "master";

  useEffect(() => {
    if (!selectedTrainId && mapQuery.data?.trains[0]) {
      setSelectedTrainId(mapQuery.data.trains[0].train.id);
    }
  }, [mapQuery.data?.trains, selectedTrainId]);

  useEffect(() => {
    setRouteForm(buildFormState(selectedRecord));
  }, [selectedRecord]);

  const routeMutation = useMutation({
    mutationFn: async (input: UpsertTrainRouteInput) => {
      if (!selectedRecord) {
        throw new Error("Select a train before saving a route.");
      }

      return updateTrainRouteRequest(selectedRecord.train.id, input);
    },
    onSuccess: async () => {
      toast.success("Route saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["map", "workspace"] }),
        selectedRecord ? queryClient.invalidateQueries({ queryKey: ["trains", selectedRecord.train.id] }) : Promise.resolve(),
        queryClient.invalidateQueries({ queryKey: ["fleet"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["shell", "trains"] })
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to save route.");
    }
  });

  function updateForm<K extends keyof RouteFormState>(field: K, value: RouteFormState[K]) {
    setRouteForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateStationQuery(field: "source" | "destination", value: string) {
    setRouteForm((current) => ({
      ...current,
      [field]: {
        query: value,
        station:
          current[field].station && current[field].station.displayName === value ? current[field].station : null
      }
    }));
  }

  function selectStation(field: "source" | "destination", station: RailwayStation) {
    setRouteForm((current) => ({
      ...current,
      [field]: {
        query: station.displayName,
        station
      }
    }));
  }

  function clearStation(field: "source" | "destination") {
    setRouteForm((current) => ({
      ...current,
      [field]: {
        query: "",
        station: null
      }
    }));
  }

  function addWaypoint() {
    setRouteForm((current) => ({
      ...current,
      waypoints: [...current.waypoints, { query: "", station: null }]
    }));
  }

  function updateWaypointQuery(index: number, value: string) {
    setRouteForm((current) => ({
      ...current,
      waypoints: current.waypoints.map((waypoint, waypointIndex) =>
        waypointIndex === index
          ? {
              query: value,
              station: waypoint.station && waypoint.station.displayName === value ? waypoint.station : null
            }
          : waypoint
      )
    }));
  }

  function selectWaypoint(index: number, station: RailwayStation) {
    setRouteForm((current) => ({
      ...current,
      waypoints: current.waypoints.map((waypoint, waypointIndex) =>
        waypointIndex === index
          ? {
              query: station.displayName,
              station
            }
          : waypoint
      )
    }));
  }

  function clearWaypoint(index: number) {
    setRouteForm((current) => ({
      ...current,
      waypoints: current.waypoints.map((waypoint, waypointIndex) =>
        waypointIndex === index
          ? {
              query: "",
              station: null
            }
          : waypoint
      )
    }));
  }

  function removeWaypoint(index: number) {
    setRouteForm((current) => ({
      ...current,
      waypoints: current.waypoints.filter((_, waypointIndex) => waypointIndex !== index)
    }));
  }

  function mapStationToRouteStop(station: RailwayStation): RouteStop {
    return {
      name: station.name,
      code: station.code,
      displayName: station.displayName,
      lat: station.lat,
      lng: station.lng,
      source: station.source,
      osmType: station.osmType,
      osmId: station.osmId
    };
  }

  async function saveRoute() {
    if (!routeForm.source.station || !routeForm.destination.station) {
      toast.error("Select both the source station and the destination station.");
      return;
    }

    const unresolvedWaypoint = routeForm.waypoints.find((waypoint) => waypoint.query.trim() && !waypoint.station);
    if (unresolvedWaypoint) {
      toast.error("Select a real station for every via stop before saving the route.");
      return;
    }

    const payload: UpsertTrainRouteInput = {
      name: routeForm.routeName.trim() || null,
      source: mapStationToRouteStop(routeForm.source.station),
      destination: mapStationToRouteStop(routeForm.destination.station),
      waypoints: routeForm.waypoints
        .flatMap((waypoint) => (waypoint.station ? [mapStationToRouteStop(waypoint.station)] : []))
    };

    await routeMutation.mutateAsync(payload);
  }

  if (mapQuery.isLoading) {
    return <MapPageSkeleton />;
  }

  if (mapQuery.isError || !mapQuery.data) {
    return (
      <ErrorState
        title="Map workspace is unavailable"
        description="CargoGuardian could not load fleet positions, routes, or incidents."
        onAction={() => {
          void mapQuery.refetch();
        }}
      />
    );
  }

  if (!mapQuery.data.trains.length) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Spatial operations"
          title="Map"
          description="Live train positions, planned routes, and recent breadcrumb trails are shown here once a visible train exists."
        />
        <EmptyState
          title="No trains are visible on the map"
          description="Add a train first or request access to one. Route overlays and live positions appear here automatically once a train is in scope."
          icon={MapPinned}
          actionHref={sessionQuery.data?.user?.role === "admin" ? ("/trains/new" as NextRoute) : undefined}
          actionLabel={sessionQuery.data?.user?.role === "admin" ? "Add train" : undefined}
        />
      </div>
    );
  }

  const selectedTrain = selectedRecord?.train ?? null;
  const selectedTelemetry = selectedRecord?.telemetry ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Spatial operations"
        title="Map"
        description="Monitor live train positions, compare planned routes to actual GPS breadcrumbs, and lock incident response to the latest known location."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <Card className="overflow-hidden border-border/60 bg-card/90 shadow-panel">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="font-display text-2xl font-bold tracking-tight">Fleet map</CardTitle>
                <CardDescription>
                  Planned routes are shaped from railway infrastructure, actual GPS breadcrumbs are amber, and red markers show active incidents.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Live markers {mapQuery.data.trains.filter((train) => train.telemetry.gpsLat !== null).length}</Badge>
                <Badge variant="outline">Active incidents {mapQuery.data.incidents.length}</Badge>
              </div>
            </div>
            {tileError ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                OpenStreetMap tiles are unavailable right now. CargoGuardian is still plotting routes and incidents against coordinate space.
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <div className={cn("overflow-hidden rounded-[1.75rem] bg-slate-200/30", tileError && "bg-[radial-gradient(circle_at_top,#dbeafe,transparent_45%),linear-gradient(135deg,#eff6ff,#f8fafc_45%,#e2e8f0)]")}>
              <OperationsMap
                trains={mapQuery.data.trains}
                incidents={mapQuery.data.incidents}
                selectedTrainId={selectedRecord?.train.id ?? null}
                onSelectTrain={setSelectedTrainId}
                onTileError={() => setTileError(true)}
              />
            </div>

            {!mapQuery.data.trains.some((train) => train.telemetry.gpsLat !== null || train.route?.plannedGeometry.length) ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                No train currently has live GPS coordinates or stored route geometry. Use the side panel to select source and destination stations.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/90 shadow-panel">
            <CardHeader className="space-y-3">
              <div className="space-y-1">
                <CardTitle className="font-display text-2xl font-bold tracking-tight">Train focus</CardTitle>
                <CardDescription>Select a train to inspect its current location, route plan, and incident context.</CardDescription>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {mapQuery.data.trains.map((record) => (
                  <button
                    key={record.train.id}
                    type="button"
                    onClick={() => setSelectedTrainId(record.train.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      record.train.id === selectedTrain?.id
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/60 bg-background/70 hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{record.train.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.train.code} | {record.telemetry.status}
                        </p>
                      </div>
                      {record.activeAlerts.length ? <Badge className="bg-red-500/15 text-red-700 dark:text-red-200">{record.activeAlerts.length} alert{record.activeAlerts.length > 1 ? "s" : ""}</Badge> : null}
                    </div>
                  </button>
                ))}
              </div>
            </CardHeader>
          </Card>

          {selectedRecord ? (
            <>
              <Card className="border-border/60 bg-card/90 shadow-panel">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="font-display text-2xl font-bold tracking-tight">{selectedRecord.train.label}</CardTitle>
                      <CardDescription>{selectedRecord.train.code}</CardDescription>
                    </div>
                    <Link href={`/fleet/${selectedRecord.train.id}` as NextRoute} className={buttonVariants({ variant: "outline" })}>
                      Open train
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoTile icon={Navigation} label="Live location" value={formatLocation(selectedTelemetry?.gpsLat ?? null, selectedTelemetry?.gpsLng ?? null)} />
                    <InfoTile icon={TrainFront} label="Speed" value={selectedTelemetry?.speedKmh == null ? "Unavailable" : `${selectedTelemetry.speedKmh.toFixed(1)} km/h`} />
                    <InfoTile
                      icon={RouteIcon}
                      label="Planned route"
                      value={
                        selectedRecord.route
                          ? `${selectedRecord.route.name}${selectedRecord.route.geometrySource === "rail-network" ? "" : " (fallback)"}`
                          : "Not saved"
                      }
                    />
                    <InfoTile icon={AlertTriangle} label="Active incidents" value={selectedRecord.activeAlerts.length ? `${selectedRecord.activeAlerts.length} active` : "None"} />
                  </div>

                  {selectedRecord.activeAlerts.length ? (
                    <div className="space-y-2 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-700 dark:text-red-200">Incident emphasis</p>
                      {selectedRecord.activeAlerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="rounded-2xl border border-red-500/15 bg-background/70 p-3">
                          <p className="font-semibold text-foreground">{alert.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/90 shadow-panel">
                <CardHeader className="space-y-2">
                  <CardTitle className="font-display text-2xl font-bold tracking-tight">Route setup</CardTitle>
                  <CardDescription>
                    Select actual railway stations so CargoGuardian can fetch the station positions and cache a rail-shaped corridor between them.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field label="Route name">
                    <Input value={routeForm.routeName} onChange={(event) => updateForm("routeName", event.target.value)} placeholder="Mumbai to Delhi corridor" />
                  </Field>
                  <div className="grid gap-4 rounded-[1.5rem] border border-border/60 bg-background/50 p-4">
                    <p className="text-sm font-semibold text-foreground">Source station</p>
                    <RailwayStationField
                      label="Search source station"
                      placeholder="Search by station name or code"
                      query={routeForm.source.query}
                      value={routeForm.source.station}
                      onQueryChange={(value) => updateStationQuery("source", value)}
                      onSelect={(station) => selectStation("source", station)}
                      onClear={() => clearStation("source")}
                    />
                  </div>

                  <div className="grid gap-4 rounded-[1.5rem] border border-border/60 bg-background/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Via stations</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addWaypoint}
                      >
                        Add via station
                      </Button>
                    </div>
                    {routeForm.waypoints.length ? (
                      <div className="space-y-3">
                        {routeForm.waypoints.map((waypoint, index) => (
                          <div key={`${selectedTrain?.id ?? "train"}-waypoint-${index}`} className="rounded-2xl border border-border/60 bg-card/80 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-foreground">Via station {index + 1}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeWaypoint(index)}
                              >
                                Remove
                              </Button>
                            </div>
                            <RailwayStationField
                              label="Search via station"
                              placeholder="Search by station name or code"
                              query={waypoint.query}
                              value={waypoint.station}
                              onQueryChange={(value) => updateWaypointQuery(index, value)}
                              onSelect={(station) => selectWaypoint(index, station)}
                              onClear={() => clearWaypoint(index)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                        Add via stations only when the corridor should be constrained through a known station or yard.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 rounded-[1.5rem] border border-border/60 bg-background/50 p-4">
                    <p className="text-sm font-semibold text-foreground">Destination station</p>
                    <RailwayStationField
                      label="Search destination station"
                      placeholder="Search by station name or code"
                      query={routeForm.destination.query}
                      value={routeForm.destination.station}
                      onQueryChange={(value) => updateStationQuery("destination", value)}
                      onSelect={(station) => selectStation("destination", station)}
                      onClear={() => clearStation("destination")}
                    />
                  </div>

                  <Button type="button" className="w-full" disabled={!canEditRoute || routeMutation.isPending} onClick={() => void saveRoute()}>
                    <Save className="h-4 w-4" />
                    {routeMutation.isPending ? "Generating rail route..." : canEditRoute ? "Save route" : "Read only"}
                  </Button>
                  {!canEditRoute ? (
                    <p className="text-xs text-muted-foreground">Only administrators and masters can edit route geometry.</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Station lookup and rail shaping run through server-side map services before the route is cached in Firestore.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
