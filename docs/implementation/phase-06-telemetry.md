# Phase 6 - Telemetry and Real-Time Updates

## Phase Overview

This phase turns CargoGuardian from a CRUD-style admin app into a live operations system. It introduces telemetry ingestion, current-snapshot reads, historical telemetry queries, and live updating UI on the dashboard and train detail screens.

The goal is not just to store telemetry, but to make the UI reliably reflect current state with freshness handling and fallback behavior when live transport is unstable.

## Objectives

- Implement telemetry ingestion path.
- Implement current telemetry snapshot reads.
- Implement historical telemetry reads.
- Add live updates on dashboard and train detail.
- Add stale/offline/fallback handling.

## Required Features

- `/api/telemetry/ingest` ingestion route
- `/api/telemetry/current`
- `/api/telemetry/current/[trainId]`
- `/api/telemetry/history`
- `/api/telemetry/stream/[trainId]` or equivalent streaming route
- Dashboard telemetry widgets using real snapshot data
- Train detail telemetry cards and charts
- Telemetry freshness badges
- Polling fallback if SSE is unavailable

## Files To Create

- `features/dashboard/components/DashboardTelemetryOverview.tsx`
- `features/dashboard/hooks/useDashboardSummary.ts`
- `features/train-detail/components/TelemetryGrid.tsx`
- `features/train-detail/components/TelemetryCard.tsx`
- `features/train-detail/components/TelemetryTrendChart.tsx`
- `features/train-detail/components/TelemetryFreshnessBadge.tsx`
- `features/train-detail/hooks/useTelemetry.ts`
- `features/train-detail/hooks/useTelemetryHistory.ts`
- `features/train-detail/hooks/useTelemetryStream.ts`
- `services/telemetry/read.ts`
- `services/telemetry/ingest.ts`
- `services/telemetry/snapshots.ts`
- `services/telemetry/aggregates.ts`
- `services/telemetry/stream.ts`
- `services/blynk/telemetry-ingest.ts`
- `lib/validation/telemetry.ts`
- `types/telemetry.ts`
- `scripts/telemetry-simulator.ts`

## Files To Update

- `app/(app)/dashboard/page.tsx`
- `app/(app)/fleet/[trainId]/page.tsx`
- `types/train.ts`
- `services/devices/assignments.ts` if it needs to expose current device linkage

## Components To Build

- `DashboardTelemetryOverview`
- `TelemetryGrid`
- `TelemetryCard`
- `TelemetryTrendChart`
- `TelemetryFreshnessBadge`
- `OfflineBanner`
- `SyncDelayedState`

## APIs To Implement

- `POST /api/telemetry/ingest`
- `GET /api/telemetry/current`
- `GET /api/telemetry/current/[trainId]`
- `GET /api/telemetry/history`
- `GET /api/telemetry/stream/[trainId]`

## Services To Implement

- Blynk payload normalization
- Telemetry ingestion service
- Current snapshot updater
- Historical record writer
- Aggregate rollup writer
- Telemetry stream publisher or streaming adapter

## Data Flow

1. Device sends telemetry through Blynk.
2. Server receives data through webhook or polling bridge.
3. Ingestion service validates payload and resolves active train/device assignment.
4. Service writes:
   - `telemetry_current/{trainId}`
   - `telemetry_history/{telemetryId}`
   - optional `telemetry_aggregates`
   - related `events`
5. Dashboard and Train Detail fetch current snapshot through API.
6. Client subscribes to stream or polling hook for updates.
7. UI shows freshness, stale, or offline states based on timestamps.

## UI Pages Affected

- `/dashboard`
- `/fleet/[trainId]`

## Integration Points

- Blynk telemetry source
- Firestore `telemetry_current`
- Firestore `telemetry_history`
- Firestore `telemetry_aggregates`
- current train/device assignment from Phase 5

## Dependencies

- Depends on Phase 5.
- Must be complete before Phase 7 and Phase 9.

## Validation Checklist

- Ingestion route accepts valid telemetry payloads.
- Current snapshot updates for the correct train.
- Historical telemetry records are written.
- Dashboard refreshes current values.
- Train detail renders current telemetry and trends.
- Stale telemetry is labeled correctly.
- If stream fails, polling fallback still updates data.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deliverables

- Telemetry ingestion pipeline
- Current snapshot API
- Historical telemetry API
- Live dashboard widgets
- Live train detail telemetry
- Telemetry simulator for local/demo use

## Hackathon Priority

**Critical for demo**

Live telemetry is a core differentiator of the demo. Without this phase the app remains static and unconvincing.
