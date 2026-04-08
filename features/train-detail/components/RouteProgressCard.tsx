"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle, MapPinned, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { RailwayStationField } from "@/features/map/components/RailwayStationField";
import { updateTrainRouteRequest } from "@/features/map/services/map-client";
import { fetchTrainRoute } from "@/features/train-detail/services/train-client";
import type { Route, RouteStop } from "@/types/route";
import type { RailwayStation } from "@/types/station";
import type { Train } from "@/types/train";

type StationFieldState = {
  query: string;
  station: RailwayStation | null;
};

type RouteFormState = {
  routeName: string;
  source: StationFieldState;
  destination: StationFieldState;
};

type RouteProgressCardProps = {
  train: Train;
  canEditRoute: boolean;
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

function createStationFieldState(query: string | null | undefined, station: RailwayStation | null = null): StationFieldState {
  return {
    query: station?.displayName ?? query ?? "",
    station
  };
}

function buildFormState(train: Train, route: Route | null | undefined): RouteFormState {
  const sourceStation = routeStopToStation(route?.source);
  const destinationStation = routeStopToStation(route?.destinationStop);

  return {
    routeName: route?.name ?? train.routeName ?? "",
    source: createStationFieldState(route?.origin ?? train.origin, sourceStation),
    destination: createStationFieldState(route?.destination ?? train.destination, destinationStation)
  };
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

function formatDistance(distanceKm: number | null) {
  if (distanceKm === null) {
    return null;
  }

  return `${distanceKm.toFixed(0)} km`;
}

function formatDuration(durationMinutes: number | null) {
  if (durationMinutes === null) {
    return null;
  }

  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function RouteProgressCard({ train, canEditRoute }: Readonly<RouteProgressCardProps>) {
  const routeQuery = useQuery({
    queryKey: ["trains", train.id, "route"],
    queryFn: () => fetchTrainRoute(train.id),
    staleTime: 30_000
  });
  const route = routeQuery.data ?? null;
  const initialFormState = buildFormState(train, route);
  const editorKey = `${train.id}:${route?.updatedAt ?? train.updatedAt}`;
  const currentSource = route?.origin ?? train.origin ?? "Not set";
  const currentDestination = route?.destination ?? train.destination ?? "Not set";
  const distanceLabel = formatDistance(route?.distanceKm ?? null);
  const durationLabel = formatDuration(route?.estimatedDurationMinutes ?? null);

  return (
    <Card className="border-border/60 bg-card/90 shadow-panel">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Route corridor</p>
            <CardTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
              Source and destination
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {canEditRoute
                ? "Select actual railway stations here to refresh the planned corridor without leaving the train page."
                : "This train keeps its map corridor from the saved source and destination stations."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{route?.geometrySource === "rail-network" ? "Rail-shaped route" : "Route summary"}</Badge>
            {distanceLabel ? <Badge variant="outline">{distanceLabel}</Badge> : null}
            {durationLabel ? <Badge variant="outline">{durationLabel}</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
          <LocationTile label="Source" value={currentSource} />
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground/70" />
          </div>
          <LocationTile label="Destination" value={currentDestination} alignEnd />
        </div>

        {routeQuery.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-[1.5rem]" />
            <Skeleton className="h-28 rounded-[1.5rem]" />
          </div>
        ) : null}

        {routeQuery.isError ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
            CargoGuardian could not read the saved mapped corridor right now. You can still search stations and save again.
          </div>
        ) : null}

        {canEditRoute ? (
          <EditableRouteEditor key={editorKey} train={train} initialFormState={initialFormState} />
        ) : (
          <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
            Only administrators and masters can change the mapped source and destination stations.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EditableRouteEditor({
  train,
  initialFormState
}: Readonly<{
  train: Train;
  initialFormState: RouteFormState;
}>) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<RouteFormState>(initialFormState);

  const routeMutation = useMutation({
    mutationFn: () => {
      if (!formState.source.station || !formState.destination.station) {
        throw new Error("Select both the source station and the destination station.");
      }

      return updateTrainRouteRequest(train.id, {
        name: formState.routeName.trim() || null,
        source: mapStationToRouteStop(formState.source.station),
        destination: mapStationToRouteStop(formState.destination.station),
        waypoints: []
      });
    },
    onSuccess: async () => {
      toast.success("Route updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trains", train.id] }),
        queryClient.invalidateQueries({ queryKey: ["trains", train.id, "route"] }),
        queryClient.invalidateQueries({ queryKey: ["map", "workspace"] }),
        queryClient.invalidateQueries({ queryKey: ["fleet"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["shell", "trains"] })
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update route.");
    }
  });

  function updateStationQuery(field: "source" | "destination", value: string) {
    setFormState((current) => ({
      ...current,
      [field]: {
        query: value,
        station:
          current[field].station && current[field].station.displayName === value ? current[field].station : null
      }
    }));
  }

  function selectStation(field: "source" | "destination", station: RailwayStation) {
    setFormState((current) => ({
      ...current,
      [field]: {
        query: station.displayName,
        station
      }
    }));
  }

  function clearStation(field: "source" | "destination") {
    setFormState((current) => ({
      ...current,
      [field]: {
        query: "",
        station: null
      }
    }));
  }

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <RailwayStationField
          label="Source station"
          placeholder="Search source station"
          query={formState.source.query}
          value={formState.source.station}
          onQueryChange={(value) => updateStationQuery("source", value)}
          onSelect={(station) => selectStation("source", station)}
          onClear={() => clearStation("source")}
          hint="Search by station name or code."
        />
        <RailwayStationField
          label="Destination station"
          placeholder="Search destination station"
          query={formState.destination.query}
          value={formState.destination.station}
          onQueryChange={(value) => updateStationQuery("destination", value)}
          onSelect={(station) => selectStation("destination", station)}
          onClear={() => clearStation("destination")}
          hint="Search by station name or code."
        />
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-foreground">Route name</span>
        <Input
          value={formState.routeName}
          onChange={(event) =>
            setFormState((current) => ({
              ...current,
              routeName: event.target.value
            }))
          }
          placeholder="Mumbai to New Delhi corridor"
        />
      </label>

      <Button type="button" className="w-full" disabled={routeMutation.isPending} onClick={() => void routeMutation.mutateAsync()}>
        {routeMutation.isPending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Updating corridor...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save source and destination
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground">
        This updates the planned rail corridor used on the map. It does not alter the train&apos;s live GPS trail.
      </p>
    </>
  );
}

function LocationTile({
  label,
  value,
  alignEnd = false
}: Readonly<{
  label: string;
  value: string;
  alignEnd?: boolean;
}>) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className={`mt-2 flex items-center gap-2 ${alignEnd ? "sm:justify-end" : ""}`}>
        {!alignEnd ? <MapPinned className="h-4 w-4 shrink-0 text-primary" /> : null}
        <span className="truncate font-semibold text-foreground">{value}</span>
        {alignEnd ? <MapPinned className="h-4 w-4 shrink-0 text-primary/70" /> : null}
      </div>
    </div>
  );
}
