# Global TODO

This file tracks all remaining work across the project. It is intentionally broader than any single phase file.

## Remaining Core Work

- Implement fleet list, train detail, and add train flows.
- Implement device inventory, device detail, pair device wizard, and assignment history.
- Add Blynk device validation and telemetry ingestion routes.
- Store realtime telemetry snapshots and historical telemetry records in Firestore.
- Add SSE or polling fallback for live telemetry and alert updates.
- Implement alert detection, alert lifecycle actions, and alert list/detail views.
- Implement event history and audit log views.
- Integrate Mapbox route and train location rendering.
- Integrate TigerGraph analytics queries and cache outputs in Firestore.
- Build dashboard aggregation and reduce query fan-out.
- Add complete empty, error, stale, and offline states.
- Write setup documentation for Firebase, Blynk, TigerGraph, and Vercel deployment.

## Authentication Follow-Ups

- Add profile hydration from Firestore so roles and preferences do not rely only on token claims/defaults.
- Expand Firestore-backed user profiles so Settings can manage preferences, operator metadata, and notification options.
- Add explicit admin tools for role management, account lifecycle controls, and read-only access assignment.
- Add a Google redirect-based auth fallback if later mobile or popup-restricted environments need it.

## Required Documentation Work

- Add Firebase setup guide in `docs/`.
- Add Firestore indexes and rules guide in `docs/`.
- Add Blynk integration guide in `docs/`.
- Add TigerGraph integration guide in `docs/`.
- Add demo mode instructions in `docs/`.
- Expand README with setup, local development, and deployment steps.

## Optional Improvements

- Add route-level breadcrumbs for nested detail pages.
- Add server-side logging adapters instead of console-only logging.
- Add optimistic mutation helpers for alert acknowledgement and resolution.
- Add chart downsampling utilities for large historical telemetry windows.
- Add background jobs or cron endpoints for analytics refresh.
- Add a user profile avatar and operator preference editing in Settings.
- Add device firmware update status and maintenance workflows.
- Add train notes or incident comments.

## Stretch Features

- Multi-device-per-train support with primary/secondary device roles.
- Geofence-based route deviation alerts.
- Analytics trend comparisons across regions or routes.
- PDF report export for alerts and analytics.
- Ops command center wallboard mode.
- Role-specific dashboards for viewer/operator/admin.

## Technical Debt To Monitor

- Current UI primitives are intentionally lightweight Phase 1 implementations and may need to be upgraded to fuller shadcn component behavior when the relevant interactions arrive.
- Theme switching is local-only and not yet persisted.
- Firebase auth wrappers are implemented, but Firestore domain service layers for trains, devices, telemetry, alerts, analytics, and history are still pending.
- Placeholder routes exist for shell completeness and should be replaced phase-by-phase rather than left in place.

## Demo Preparation TODO

- Add demo telemetry simulator script under `scripts/`.
- Seed a small realistic train/device/alert dataset.
- Prepare one “hero train” with active telemetry, one warning case, one critical case, and one offline case.
- Add fallback analytics snapshots when TigerGraph is slow or unavailable.
- Precompute dashboard summary snapshots for presentation stability.
