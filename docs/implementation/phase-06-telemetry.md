# Phase 6 - Telemetry and Real-Time Updates

## Phase Overview

This phase turns CargoGuardian into a live operations product.

The goal is not generic telemetry. The goal is a real operational read model for:

- pre-clearance inspection
- clearance-ready state
- in-transit monitoring
- freshness / offline awareness
- derived speed from GPS history

## Objectives

- implement current telemetry read APIs
- implement telemetry history reads
- derive speed from GPS points
- expose current operational state on dashboard and train detail
- show stale and offline states cleanly

## Required Features

- `GET /api/telemetry/current`
- `GET /api/telemetry/current/[trainId]`
- `GET /api/telemetry/history`
- `GET /api/telemetry/stream/[trainId]` or controlled polling alternative
- dashboard telemetry overview using real snapshot data
- train-detail telemetry cards
- freshness indicators
- fallback when streaming is unavailable

## Data Rules

Primary raw hardware fields:

- `weightKg`
- `gpsLat`
- `gpsLng`
- `rfidLastScan`
- `rfidLastTag`
- `clearanceLed`
- `weightWarningState`

Derived fields required in this phase:

- `speedKmh`
- last-known movement state
- freshness / offline state
- weight status display
- current journey-stage display

Important:

- do not treat speed as a primary hardware sensor
- do not add fake telemetry for the UI
- worker visibility rules from Phase 4 still apply to telemetry reads

## Files To Create

- `features/dashboard/components/DashboardTelemetryOverview.tsx`
- `features/train-detail/components/TelemetryGrid.tsx`
- `features/train-detail/components/TelemetryCard.tsx`
- `features/train-detail/components/TelemetryTrendChart.tsx`
- `features/train-detail/components/TelemetryFreshnessBadge.tsx`
- `features/train-detail/hooks/useTelemetry.ts`
- `features/train-detail/hooks/useTelemetryHistory.ts`
- `features/train-detail/hooks/useTelemetryStream.ts`
- `services/telemetry/read.ts`
- `services/telemetry/derive.ts`
- `services/telemetry/stream.ts`
- `lib/validation/telemetry.ts`
- `types/telemetry.ts`

## Files To Update

- `app/(app)/dashboard/page.tsx`
- `app/(app)/fleet/[trainId]/page.tsx`
- `services/telemetry/ingest.ts`
- `services/trains/read.ts`

## Validation Checklist

- current snapshot reads return the correct train
- history reads are ordered and scoped correctly
- speed is derived from GPS history
- dashboard shows current telemetry using real Firestore data
- train detail shows freshness and offline states
- worker cannot fetch telemetry for post-clearance trains
- `npm run lint`, `npm run typecheck`, and `npm run build` pass

## Deliverables

- current telemetry API
- telemetry history API
- derived-speed foundation
- live telemetry cards on dashboard and train detail
- freshness and offline handling

## Hackathon Priority

Critical for demo.

## Implementation Notes

Phase 6 is complete.

Implemented in this phase:

- `GET /api/telemetry/current`
- `GET /api/telemetry/current/[trainId]`
- `GET /api/telemetry/history`
- `GET /api/telemetry/stream/[trainId]`
- shared telemetry validation and response types
- shared telemetry derivation helpers for:
  - freshness / stale / offline state
  - movement state
  - derived speed from sequential GPS points
  - journey-stage display fallback to offline when telemetry is stale
- dashboard telemetry overview cards using real Firestore-backed current snapshots
- train-detail telemetry grid, freshness badge, trend chart, and stream-to-polling fallback hooks
- ingest updates to preserve legacy speed compatibility while storing derived speed and movement state

## Deviations

- The ingest path still accepts legacy `speedKmh`, `errorLed`, and `weightWarningLightColor` fields for compatibility, but the read model now prefers `derivedSpeedKmh` and `weightWarningState`.
- The correction pass after Phase 6 made webhook ingest more tolerant of string-like Blynk values and added a direct Blynk diagnostic-read path for one train, but it kept the webhook as the primary inbound telemetry architecture.
- The dashboard telemetry overview focuses on current visible-train telemetry and a selected-train spotlight card instead of replacing the existing fleet summary cards.
- The demo correction now uses browser-controlled demo publishing for deployed sessions whenever the demo device is configured, so normal demo use no longer needs a separate simulator terminal. The optional local MQTT simulator remains only for explicit fallback testing; CargoGuardian still receives demo telemetry only through the same webhook path as real hardware.

## Deferred Items

- The repo now includes the `telemetry_history` composite index definition for `trainId + createdAt`, but that index still needs to exist in each Firestore environment.
- Fleet-table telemetry freshness overlays are deferred to a later phase because this phase scoped telemetry UI to dashboard and train detail.
