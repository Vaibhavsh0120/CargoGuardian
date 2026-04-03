# CargoGuardian

CargoGuardian is a dashboard-first rail cargo monitoring platform for trains equipped with ESP32 sensor devices. The application is being built on Next.js 15 with React 19, TypeScript, Tailwind CSS, Firebase, Mapbox, Recharts, and TigerGraph.

## Current Status

- Phase 1 is complete.
- The repository contains the production foundation: App Router setup, theme system, shared providers, placeholder routes, Firebase bootstraps, and a health check endpoint.
- Business features are intentionally being added in later phases.

## Development Phases

This project is implemented phase-by-phase so the application remains runnable and architecturally controlled at every step.

Primary planning documents:

- [Agent Operating Manual](./AGENTS.md)
- [Phase Index](./docs/implementation/PHASE_INDEX.md)
- [How To Continue](./docs/implementation/HOW_TO_CONTINUE.md)
- [Global TODO](./docs/implementation/GLOBAL_TODO.md)

Detailed phase playbooks:

- [Phase 2 - Authentication System](./docs/implementation/phase-02-authentication.md)
- [Phase 3 - App Shell and Navigation](./docs/implementation/phase-03-app-shell.md)
- [Phase 4 - Fleet and Train Management](./docs/implementation/phase-04-fleet-management.md)
- [Phase 5 - Device Pairing and Hardware Management](./docs/implementation/phase-05-device-pairing.md)
- [Phase 6 - Telemetry and Real-Time Updates](./docs/implementation/phase-06-telemetry.md)
- [Phase 7 - Alerts and Event History](./docs/implementation/phase-07-alerts-history.md)
- [Phase 8 - Map Integration](./docs/implementation/phase-08-map.md)
- [Phase 9 - Analytics Integration](./docs/implementation/phase-09-analytics.md)
- [Phase 10 - Dashboard Optimization and Polishing](./docs/implementation/phase-10-polish.md)

## Local Development

```bash
npm install
npm run dev
```

## Validation Commands

```bash
npm run lint
npm run typecheck
npm run build
```

## Health Check

The foundation exposes:

- `GET /api/health` -> `{ "status": "ok" }`

## Architecture Notes

The architecture and implementation sequence were planned before coding began. Future work should continue through the phase documents in `docs/implementation/` rather than skipping ahead.
