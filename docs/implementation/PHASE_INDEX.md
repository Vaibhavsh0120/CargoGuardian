# CargoGuardian Phase Index

CargoGuardian is being built in controlled phases. Each phase must leave the app runnable and consistent with the operational model.

Phases 1 through 7 are complete.

Important architecture decisions already locked in:

- Train = Device
- no separate `devices` collection
- demo controls depend on configured demo-device credentials
- the demo simulator publishes to one configured Blynk device and reaches CargoGuardian only through the normal webhook path
- Blynk webhooks remain the primary inbound telemetry path, while outbound device commands should use server-side Blynk device API writes with the stored train token
- worker visibility is pre-clearance only
- masters can review worker access requests for trains they manage
- future installable web-app support must keep live telemetry network-first and auto-refreshing rather than relying on manual reloads
- future map work must distinguish planned route geometry from actual GPS travel history
- TigerGraph remains a server-side analytics engine whose results are cached back into Firestore

## Phase Order

1. Phase 1 - Project Initialization `(completed)`
2. Phase 2 - Authentication System `(completed)`
3. Phase 3 - App Shell and Navigation `(completed)`
4. Phase 4 - Fleet and Train Management `(completed)`
5. Phase 5 - Device Pairing and Hardware Management `(completed)`
6. Phase 6 - Telemetry and Real-Time Updates `(completed)`
7. Phase 7 - Alerts, Clearance, and Event History `(completed)`
8. Phase 8 - Map Integration
9. Phase 9 - Analytics Integration
10. Phase 10 - Dashboard Optimization and Polishing

## Summary Table

| Phase | Status | Primary Output |
| --- | --- | --- |
| 1 - Project Initialization | Completed | Runnable Next.js foundation, theme, providers, Firebase bootstrap |
| 2 - Authentication System | Completed | Auth flows, session cookies, protected routes |
| 3 - App Shell and Navigation | Completed | Desktop/mobile shell, train selector, loading and error states |
| 4 - Fleet and Train Management | Completed | Fleet list, train detail, Add Train, role-scoped access model |
| 5 - Device Pairing and Hardware Management | Completed | Manual Blynk device linking, ingest route, simulator |
| 6 - Telemetry and Real-Time Updates | Completed | Current telemetry APIs, derived speed/freshness, live dashboard and train-detail telemetry UI |
| 7 - Alerts, Clearance, and Event History | Completed | Alert rules, request inbox UI, role-based access workspace, clearance actions, event logging, branded installable-app foundation, and action-first dashboard restructure |
| 8 - Map Integration | Pending | Free live train map, source/destination route modeling, planned-vs-actual path overlays, incident-location support |
| 9 - Analytics Integration | Pending | TigerGraph graph pipeline, train/route/corridor risk insights, and Firestore-cached analytics views |
| 10 - Dashboard Optimization and Polishing | Pending | Final performance budgets, install QA, docs, resilience, and demo hardening |

## Dependency Rules

- Do not start Phase 6 until Phase 5 provisioning and ingest remain green.
- Do not start Phase 7 until Phase 6 current telemetry reads exist.
- Do not start Phase 8 until Phase 6 exposes current train locations.
- Do not start Phase 9 until telemetry and alerts exist.
- Do not start Phase 10 until the product path is functionally complete.

## Demo Path

The minimum convincing demo path is:

1. Login
2. Dashboard
3. Fleet
4. Add Train
5. Auth Token provisioned to hardware
6. Live telemetry
7. Clearance and access workflow
8. Transit incident alert
9. Analytics view

## Required Reading Before Any Work

Read in this order:

1. [../../AGENTS.md](../../AGENTS.md)
2. [HOW_TO_CONTINUE.md](./HOW_TO_CONTINUE.md)
3. [GLOBAL_TODO.md](./GLOBAL_TODO.md)
4. the next incomplete phase file
5. the relevant current code

## Completion Standard

A phase is complete only when:

- planned routes render
- planned APIs exist
- planned services exist in the correct layer
- docs are updated for deviations
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run build` passes

## Current Next Phase

The next implementation phase is:

- [phase-08-map.md](./phase-08-map.md)
