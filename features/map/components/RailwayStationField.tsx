"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, MapPinned, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { searchRailwayStationsRequest } from "@/features/map/services/map-client";
import { cn } from "@/lib/utils";
import type { RailwayStation } from "@/types/station";

type RailwayStationFieldProps = {
  label: string;
  placeholder: string;
  query: string;
  value: RailwayStation | null;
  onQueryChange: (value: string) => void;
  onSelect: (station: RailwayStation) => void;
  onClear: () => void;
  hint?: string;
};

export function RailwayStationField({
  label,
  placeholder,
  query,
  value,
  onQueryChange,
  onSelect,
  onClear,
  hint
}: RailwayStationFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const deferredQuery = useDeferredValue(query.trim());
  const stationQuery = useQuery({
    queryKey: ["stations", "search", deferredQuery],
    queryFn: () => searchRailwayStationsRequest(deferredQuery),
    staleTime: 5 * 60_000,
    enabled: deferredQuery.length >= 2
  });

  const stations = stationQuery.data?.stations ?? [];
  const shouldShowResults = isFocused && deferredQuery.length >= 2 && (stationQuery.isLoading || stations.length > 0);
  const helperCopy = useMemo(() => {
    if (value) {
      return `${value.displayName} | ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`;
    }

    if (stationQuery.isError) {
      return "Station lookup failed. Try a broader station name or code.";
    }

    if (deferredQuery.length >= 2 && !stationQuery.isLoading && !stations.length) {
      return "No railway station matched that search.";
    }

    return hint ?? "Search by station name or code.";
  }, [deferredQuery.length, hint, stationQuery.isError, stationQuery.isLoading, stations.length, value]);

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              window.setTimeout(() => {
                setIsFocused(false);
              }, 120);
            }}
            placeholder={placeholder}
            className="pl-9 pr-10"
          />
          {value ? (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={`Clear ${label}`}
            >
              <X className="h-4 w-4" />
            </button>
          ) : stationQuery.isLoading ? (
            <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        {shouldShowResults ? (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-border/70 bg-popover p-2 shadow-panel">
            {stationQuery.isLoading ? (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Searching railway stations...
              </div>
            ) : (
              stations.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    onSelect(station);
                    setIsFocused(false);
                  }}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left transition hover:bg-muted/60",
                    value?.id === station.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{station.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {station.kind} | {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                      </p>
                    </div>
                    <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">{helperCopy}</p>
      {value ? (
        <div className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground">
          {value.displayName}
        </div>
      ) : null}
    </label>
  );
}
