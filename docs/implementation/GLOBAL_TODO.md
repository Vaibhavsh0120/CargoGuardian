# Global TODO

This file tracks all remaining work across the project. It is intentionally broader than any single phase file.

## Remaining Core Work

- Implement Firebase Auth login, signup, logout, and session verification.
- Add middleware and route-group protection for authenticated application routes.
- Replace shell placeholders with production navigation and contextual status indicators.
- Build train selector context and persist selected train state correctly.
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
- Firebase client and admin initialization exist, but auth wrappers and Firestore service layers are not yet implemented.
- Placeholder routes exist for shell completeness and should be replaced phase-by-phase rather than left in place.

## Demo Preparation TODO

- Add demo telemetry simulator script under `scripts/`.
- Seed a small realistic train/device/alert dataset.
- Prepare one “hero train” with active telemetry, one warning case, one critical case, and one offline case.
- Add fallback analytics snapshots when TigerGraph is slow or unavailable.
- Precompute dashboard summary snapshots for presentation stability.
