# CargoGuardian

CargoGuardian is a dashboard-first rail cargo monitoring platform for trains equipped with ESP32 sensor devices. The application is being built on Next.js 15 with React 19, TypeScript, Tailwind CSS, Firebase, Mapbox, Recharts, and TigerGraph.

## Current Status

- Phases 1, 2, 3, and 4 are complete.
- The repository now contains:
  - App Router foundation
  - theme system and shared providers
  - Firebase client auth integration
  - Firebase Admin session-cookie authentication
  - server-side Firestore user profile creation for authenticated users
  - email/password and Google auth flows
  - password reset flow
  - login, signup, logout, and session APIs
  - onboarding flow for Google auth users to select their role
  - admin invite flow for creating admin accounts
  - production protected app shell with desktop/mobile navigation
  - train selector context with persisted selection
  - shell loading, empty, and error state components
  - protected app layout guard and shell status APIs
  - commit-safety protections for local secrets and service-account files
  - fleet list with search, status filter, and sort
  - train detail page with overview and route progress
  - add train workflow with Firestore-backed creation
  - role-scoped train access (admin sees all, masters see assigned, workers see clearance-scoped)
  - train access grant, revoke, and request endpoints
  - dashboard summary based on live, role-scoped train counts
  - demo mode fallback behind `NEXT_PUBLIC_DEMO_MODE`
- Devices, telemetry, alerts, map, analytics, and final dashboard workflows are intentionally being added in later phases.

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
