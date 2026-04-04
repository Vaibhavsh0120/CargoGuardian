# CargoGuardian Phase Index

This repository is being built in controlled phases. Each phase is intended to leave the application in a runnable, reviewable state before the next layer is added.

Phases 1 through 4 are complete. All later phases remain pending and should be executed in order unless a later document explicitly states that some tasks may be parallelized safely.

Before starting any phase, read [../../AGENTS.md](../../AGENTS.md).

## Phase Order

1. Phase 1 - Project Initialization `(completed)`
2. Phase 2 - Authentication System `(completed)`
3. Phase 3 - App Shell and Navigation `(completed)`
4. Phase 4 - Fleet and Train Management `(completed)`
5. Phase 5 - Device Pairing and Hardware Management
6. Phase 6 - Telemetry and Real-Time Updates
7. Phase 7 - Alerts and Event History
8. Phase 8 - Map Integration
9. Phase 9 - Analytics Integration
10. Phase 10 - Dashboard Optimization and Polishing

## Summary Table

| Phase | Status | Depends On | Difficulty | Demo Relevance | Primary Output |
| --- | --- | --- | --- | --- | --- |
| 1 - Project Initialization | Completed | None | Medium | Critical | Runnable Next.js foundation, theme, providers, Firebase bootstraps |
| 2 - Authentication System | Completed | 1 | Medium | Critical | Firebase Auth, protected routes, session handling |
| 3 - App Shell and Navigation | Completed | 1, 2 | Medium | Critical | Production shell, desktop/mobile navigation, route scaffolding |
| 4 - Fleet and Train Management | Completed | 2, 3 | High | Critical | Fleet list, train detail, add train flow |
| 5 - Device Pairing and Hardware Management | Pending | 4 | High | Critical | Device inventory, pairing workflow, assignment lifecycle |
| 6 - Telemetry and Real-Time Updates | Pending | 5 | High | Critical | Live telemetry, current snapshots, streaming/polling |
| 7 - Alerts and Event History | Pending | 6 | High | Critical | Alert lifecycle, history feeds, event logging |
| 8 - Map Integration | Pending | 4, 6 | Medium-High | Useful but not mandatory | Mapbox route view, markers, overlays |
| 9 - Analytics Integration | Pending | 6, 7 | High | Critical | TigerGraph insights, analytics cache, analytics screens |
| 10 - Dashboard Optimization and Polishing | Pending | 2-9 | Medium | Critical | Responsive polish, empty/error states, docs, demo readiness |

## Dependency Rules

- Do not start Phase 2 until Phase 1 remains green under `npm run lint`, `npm run typecheck`, and `npm run build`.
- Do not start Phase 4 until Phase 3 finishes the shared app shell and navigation, because Fleet and Train Detail must be composed inside the real shell rather than reworked later.
- Do not start Phase 6 until device assignment from Phase 5 exists, because telemetry needs a reliable train-to-device relationship.
- Do not start Phase 7 until Phase 6 is writing current telemetry snapshots and event sources, because alerts and history depend on those records.
- Do not start Phase 9 until telemetry and alerts are available, because analytics needs historical signals and actionable UI destinations.
- Phase 8 can be delayed for hackathon prioritization if the minimum viable demo is already achieved through Phases 2, 3, 4, 5, 6, 7, and 9.

## Demo Path

The minimum convincing hackathon demo requires these phases:

- Phase 2 - Authentication System `(completed)`
- Phase 3 - App Shell and Navigation `(completed)`
- Phase 4 - Fleet and Train Management `(completed)`
- Phase 5 - Device Pairing and Hardware Management
- Phase 6 - Telemetry and Real-Time Updates
- Phase 7 - Alerts and Event History
- Phase 9 - Analytics Integration

Phase 8 is additive for demo value but not strictly required if time becomes constrained.

## Required Reading Before Each Phase

Before implementing any incomplete phase, the next agent should read:

1. [../../AGENTS.md](../../AGENTS.md)
2. [HOW_TO_CONTINUE.md](./HOW_TO_CONTINUE.md)
3. The current phase file in this folder
4. The previous completed phase file
5. The current code under `app/`, `components/`, `features/`, `services/`, `lib/`, and `types/`

## Phase Completion Standard

A phase is considered complete only when all of the following are true:

- Planned routes for the phase render correctly.
- APIs for the phase exist and behave as documented.
- Required services are implemented in the correct layer.
- UI components are placed in the planned folders and reused appropriately.
- Validation steps in the phase document have been executed.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- The phase file is updated to reflect any deviations or newly discovered constraints.

## Current Next Phase

The next implementation phase is:

- [phase-05-device-pairing.md](./phase-05-device-pairing.md)
