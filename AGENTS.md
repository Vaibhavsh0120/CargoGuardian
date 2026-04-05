# CargoGuardian Agent Operating Manual

This file is the primary operating manual for anyone continuing work in this repository.

CargoGuardian already has an implementation plan. Continue that plan. Do not invent a new product.

## 1. Mission

Build **CargoGuardian**, a dashboard-first rail cargo clearance and monitoring platform for trains equipped with one ESP32-based hardware unit per train.

The real product is:

- clearance-controlled cargo operations
- weight-sensitive cargo safety and theft detection
- live GPS monitoring during transit
- role-scoped train visibility
- server-routed integrations only

## 2. Product Model

CargoGuardian is not a generic device dashboard. The operating model is:

1. Admin creates the train.
2. Admin creates the matching Blynk device manually from the template.
3. The Blynk device name must match the train code.
4. The device Auth Token is copied into CargoGuardian and then flashed into the ESP32 firmware or provisioning flow.
5. The train enters pre-departure inspection.
6. Worker can inspect the train only before clearance is granted.
7. Master or admin can grant clearance remotely or via RFID-confirmed workflow.
8. After clearance, worker should no longer see that train.
9. During transit, CargoGuardian shows live location and derived speed.
10. Significant weight change during transit should become an alert and incident signal.

## 3. Hardware Truth

Primary hardware signals are:

- `weightKg`
- `gpsLat`
- `gpsLng`
- `rfidLastScan`
- `rfidLastTag`
- `clearanceLed`
- `weightWarningState`

Important semantics:

- The warning light is one hardware indicator:
  - `-1` = underweight / device blinks locally
  - `0` = safe / light off
  - `1` = overweight / device stays on locally
- Speed is derived in CargoGuardian from GPS history. It is not a primary hardware sensor.
- Train power/offline state is inferred from reporting freshness. Do not design around a battery model.
- Demo hardware must follow the same ingest path and field semantics as real hardware.

## 4. Current State

At the time of this file:

- Phases 1, 2, 3, 4, 5, and 6 are complete.
- Phase 7 is the next implementation phase.
- The repo already contains:
  - Next.js 15 App Router foundation
  - strict TypeScript
  - auth flows with Firebase Auth + Firebase Admin session cookies
  - admin invite flow
  - onboarding for worker/master role selection
  - protected app shell
  - fleet list, train detail, dashboard summary
  - admin-only train creation
  - manual Blynk device linking during train creation
  - Auth Token stored on the train after linking
  - telemetry ingest endpoint
  - current telemetry read APIs
  - telemetry history reads
  - derived speed / freshness / offline telemetry logic
  - dashboard telemetry overview
  - train-detail telemetry cards and trend chart
  - console-controlled demo publisher for deployed app sessions
  - browser-controlled demo publisher with no separate demo terminal required for normal use
  - optional manual MQTT demo simulator only for explicit local fallback testing
  - role-scoped access model
  - request / approve / reject / grant / revoke / delegate APIs

## 5. Read Order Before Any Work

Before editing code, read these files in this exact order:

1. `AGENTS.md`
2. `docs/implementation/PHASE_INDEX.md`
3. `docs/implementation/HOW_TO_CONTINUE.md`
4. `docs/implementation/GLOBAL_TODO.md`
5. the next incomplete phase file in `docs/implementation/`

Then inspect the relevant code under:

- `app/`
- `components/`
- `features/`
- `hooks/`
- `services/`
- `lib/`
- `types/`

## 6. Non-Negotiable Rules

- Work phase-by-phase.
- Keep the app runnable at all times.
- Do not skip phases unless the user explicitly overrides the plan.
- Do not implement unrelated future features.
- Do not expose secrets to the client.
- Route privileged Firebase, Blynk, TigerGraph, and future Mapbox shaping through server-side code.
- Do not mix fake data into real UI flows.
- Demo controls should depend on actual demo-device configuration, not a separate client toggle.
- Do not show a "demo data" badge or alternate UI mode.
- If architecture changes, update docs in the same turn.

## 7. Architecture Snapshot

Frontend:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- Recharts
- free map tooling only; do not require paid Mapbox access

Backend and integrations:

- Next.js Route Handlers
- Firebase Auth
- Firebase Firestore
- Firebase Admin
- Blynk
- TigerGraph

Deployment target:

- Vercel

## 8. Required Layering

- `app/`: routes, layouts, route handlers, loading/error boundaries
- `components/ui/`: primitive shared UI
- `components/`: shared domain-aware UI
- `features/`: domain modules
- `hooks/`: cross-feature hooks
- `services/`: business logic and integration adapters
- `lib/`: validation, auth, env, utilities, constants
- `types/`: shared domain types

Rules:

- Keep business logic out of page files.
- Route handlers orchestrate services; they do not become the whole business layer.
- Server-only integration code stays off the client.

## 9. Routing Model

Primary app routes:

- `/login`
- `/signup`
- `/dashboard`
- `/fleet`
- `/fleet/[trainId]`
- `/trains/new`
- `/alerts`
- `/history`
- `/map`
- `/analytics`
- `/settings`

There is no separate `/devices` route anymore. Train = Device.

## 10. Core Domain Model

Main entities:

- User
- Train
- Train Assignment
- Access Request
- Telemetry Snapshot
- Telemetry History Record
- Alert
- Event
- Analytics Insight
- Route
- Audit Log

Train is the central entity. It carries both operational metadata and the embedded hardware identity used by Blynk.

## 11. Firestore Collections

Current planned collections:

- `users`
- `trains`
- `trainAssignments`
- `accessRequests`
- `telemetry_current`
- `telemetry_history`
- `telemetry_aggregates`
- `alerts`
- `analyticsInsights`
- `routes`
- `events`
- `auditLogs`
- `systemStatus`
- `dashboardSnapshots`

Do not reintroduce `devices` or `deviceAssignments` unless the architecture changes and the docs are updated in the same turn.

## 12. Access Model

Roles:

- `admin`
- `master`
- `worker`

Implemented access rules:

- Admin can see all trains.
- Master can see trains they own or are actively assigned.
- Worker can see assigned trains only while those trains remain in pre-clearance stages.
- Revoked assignments must not grant visibility.

Operational rules:

- Only admin can create trains.
- Admin can grant or revoke train access for any role.
- Master can grant, revoke, approve, and reject worker access only for trains they manage.
- Worker can request train access.
- Worker visibility ends when clearance is granted or the train moves into cleared / in-transit stages.

## 13. Train State Rules

The train document must support at least these operational fields:

- `clearanceStatus`
- `clearanceGrantedAt`
- `clearanceGrantedBy`
- `clearanceMethod`
- `journeyStage`
- `weightStatus`

Expected meanings:

- `clearanceStatus`: `pending | granted | revoked`
- `clearanceMethod`: `remote | rfid`
- `journeyStage`: `inspection | clearance-pending | cleared | in-transit | incident | offline`
- `weightStatus`: `unknown | safe | underweight | overweight`

## 14. Integration Rules

Firebase:

- Auth is authoritative for identity.
- Firestore is the operational source of truth.
- Use Firebase Admin for privileged reads/writes.

Blynk:

- Blynk template webhook posts into `/api/telemetry/ingest`.
- Ingest resolves trains by `train.code`.
- The Blynk device name must match the train code.
- Device Auth Tokens are per-device and are stored on the train during Add Train.
- Inbound telemetry should use the webhook path; CargoGuardian should not replace that with general polling from Blynk.
- Outbound device commands should use the stored per-device Auth Token from server-side code.

Map provider policy:

- Do not require paid Mapbox usage or card details for development.
- Prefer free map infrastructure such as OpenStreetMap tiles and a free client library in the later map phase.

TigerGraph:

- Browser never calls TigerGraph directly.
- Cache outputs in Firestore.

## 15. Real-Time Rules

- Current telemetry reads come from `telemetry_current`.
- Historical telemetry reads come from `telemetry_history` or aggregates.
- Live UI should use SSE or controlled polling.
- Always show freshness or stale indicators once telemetry UI exists.
- Always provide degraded states for stale or missing telemetry.

## 16. Demo Rules

The demo must look like the real product.

- Demo controls should be available when the demo device is configured.
- The simulator should behave like one configured hardware device, not a special train selector.
- The simulator must generate its own demo telemetry values.
- When the demo device is configured, the browser may expose a console helper that writes simulator control state through server APIs.
- The deployed app demo publisher is stopped by default and starts only when a page session explicitly triggers it.
- The deployed app demo publisher writes to Blynk using a dedicated demo device Auth Token and reaches CargoGuardian only through the existing Blynk webhook.
- The demo Blynk device name must still match the normal `train.code` rule.
- The UI must not branch to fake train lists, fake dashboard counts, or fake cards.
- Do not add a demo banner, demo badge, or alternate screen copy.

## 17. Phase Protocol

When working on a phase:

1. Confirm which phase is next in `PHASE_INDEX.md`.
2. Read the full phase file.
3. Inspect the existing code it depends on.
4. Implement only that phase unless the user explicitly asks for a correction pass on already-completed work.
5. Validate the phase.
6. Update docs before stopping.

## 18. Required Documentation Updates

After a completed phase or architecture correction, update:

- `docs/implementation/PHASE_INDEX.md`
- the active phase file
- `docs/implementation/GLOBAL_TODO.md`
- `README.md`
- `AGENTS.md` if the operating model changed

Also update `.env.example` or setup docs if environment requirements changed.

## 19. Validation Expectations

At minimum run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

If one of these fails, the work is not complete.

## 20. Current Next Step

The next implementation phase is:

- `docs/implementation/phase-07-alerts-history.md`
