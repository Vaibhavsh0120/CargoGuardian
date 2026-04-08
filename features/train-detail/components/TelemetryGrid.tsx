"use client";

import { Activity, Gauge, MapPinned, RadioTower, ScanLine, ShieldCheck } from "lucide-react";

import { ErrorState } from "@/components/states/ErrorState";
import { TelemetryGridSkeleton } from "@/components/states/PageSkeletons";
import { Badge } from "@/components/ui/badge";
import { TelemetryFreshnessBadge } from "@/features/train-detail/components/TelemetryFreshnessBadge";
import type { TelemetrySnapshot } from "@/types/telemetry";

import { TelemetryCard } from "./TelemetryCard";
import type { TelemetryStreamMode } from "../hooks/useTelemetryStream";

type TelemetryGridProps = {
  telemetry: TelemetrySnapshot | null;
  isLoading: boolean;
  isError: boolean;
  streamMode: TelemetryStreamMode;
  onRetry: () => void;
};

export function TelemetryGrid({ telemetry, isLoading, isError, streamMode, onRetry }: TelemetryGridProps) {
  if (isLoading) {
    return <TelemetryGridSkeleton />;
  }

  if (isError || !telemetry) {
    return (
      <ErrorState
        title="Telemetry could not be loaded"
        description="CargoGuardian could not read the latest train telemetry. Try again."
        onAction={onRetry}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Live telemetry</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Current operating state</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={streamMode === "polling" ? "outline" : "secondary"}>
            {streamMode === "polling" ? "Polling fallback" : "Live stream"}
          </Badge>
          <TelemetryFreshnessBadge
            freshnessState={telemetry.freshnessState}
            reportedAt={telemetry.reportedAt}
            ageSeconds={telemetry.ageSeconds}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <TelemetryCard
          title="Feed freshness"
          value={telemetry.hasTelemetry ? formatReportedAt(telemetry.reportedAt) : "Waiting"}
          description={
            telemetry.hasTelemetry
              ? telemetry.isOffline
                ? "The last telemetry update is outside the offline threshold."
                : telemetry.isStale
                  ? "The device has reported recently, but the feed is becoming stale."
                  : "The train is reporting within the healthy freshness window."
              : "No webhook update has reached this train yet."
          }
          icon={Activity}
          badge={
            <TelemetryFreshnessBadge
              freshnessState={telemetry.freshnessState}
              reportedAt={telemetry.reportedAt}
              ageSeconds={telemetry.ageSeconds}
            />
          }
        />

        <TelemetryCard
          title="Derived speed"
          value={telemetry.speedKmh === null ? "Unknown" : `${telemetry.speedKmh.toFixed(1)} km/h`}
          description={
            telemetry.speedKmh === null
              ? "CargoGuardian needs at least two GPS points to derive speed."
              : `Movement state is ${telemetry.movementState}.`
          }
          icon={Gauge}
        />

        <TelemetryCard
          title="Cargo weight"
          value={telemetry.weightKg === null ? "Unavailable" : `${Math.round(telemetry.weightKg).toLocaleString()} kg`}
          description={`Weight state is ${telemetry.displayWeightStatus}. Warning light is ${telemetry.weightWarningLabel}.`}
          icon={RadioTower}
        />

        <TelemetryCard
          title="GPS position"
          value={formatLocation(telemetry.gpsLat, telemetry.gpsLng)}
          description={
            telemetry.gpsLat !== null && telemetry.gpsLng !== null
              ? "The latest GPS fix is ready for map and movement derivation."
              : "Waiting for usable GPS coordinates from the hardware feed."
          }
          icon={MapPinned}
        />

        <TelemetryCard
          title="RFID and clearance"
          value={telemetry.rfidLastTag ?? "No recent scan"}
          description={
            telemetry.rfidLastScan
              ? `Last RFID interaction at ${formatReportedAt(telemetry.rfidLastScan)}. Clearance LED is ${telemetry.clearanceLed ? "on" : "off"}.`
              : `No RFID scan is recorded yet. Clearance LED is ${telemetry.clearanceLed ? "on" : "off"}.`
          }
          icon={ScanLine}
        />

        <TelemetryCard
          title="Signal strength"
          value={telemetry.signalStrength === null ? "Unavailable" : `${Math.round(telemetry.signalStrength)} dBm`}
          description={`Journey display is ${telemetry.displayJourneyStage}.`}
          icon={ShieldCheck}
        />
      </div>
    </section>
  );
}

function formatLocation(lat: number | null, lng: number | null) {
  if (lat === null || lng === null) {
    return "No fix";
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function formatReportedAt(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
