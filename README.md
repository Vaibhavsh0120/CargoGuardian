# CargoGuardian

CargoGuardian is a dashboard-first rail cargo clearance and monitoring platform built with Next.js 15, React 19, TypeScript, Tailwind CSS, Firebase, Blynk, free map tooling, Recharts, and TigerGraph.

## Current Status

- Phases 1, 2, 3, 4, 5, 6, and 7 are complete.
- Phase 8 is the next implementation phase.
- The implemented foundation already includes:
  - email/password and Google auth
  - admin invite flow
  - worker/master onboarding
  - `not-set` role gating for incomplete operator accounts
  - Firebase Admin session-cookie auth
  - protected dashboard shell
  - fleet list and train detail
  - admin-only Add Train flow
  - manual Blynk device linking during train creation
  - role-scoped train access
  - access request, approval, rejection, grant, revoke, and delegate APIs plus reviewer/worker request UI
  - current telemetry APIs and train-scoped history reads
  - derived speed, freshness, stale, and offline telemetry state
  - live dashboard telemetry overview
  - live train-detail telemetry cards, trend chart, and stream fallback
  - telemetry ingest endpoint
  - alert rules for overweight, underweight, stale/offline telemetry, and in-transit weight change
  - real alerts page, layered role-based access workspace, and train-scoped alert/history panels
  - remote and RFID-backed clearance workflows with Blynk clearance-LED sync
  - event logging pipeline for alert, access, and clearance activity
  - action-first dashboard restructure with role-specific operator views
  - branded app identity, supplied app icon, and manifest-based installable-app foundation
  - targeted live refresh for operational screens on interval, focus, reconnect, and visibility changes
  - console-controlled demo publisher for deployed app sessions
  - browser-controlled demo publisher with no separate demo terminal required for normal use
  - optional manual MQTT simulator only for explicit fallback testing

## Planned Next Phases

- Phase 8 will add the free map stack using planned source/destination routes, actual GPS breadcrumb trails, live train markers, and incident-location context.
- Phase 9 will use TigerGraph server-side for train, route, and corridor risk analysis, then cache those insights back into Firestore for the UI.
- Phase 10 will harden performance, installability, stale/offline handling, deployment docs, and demo readiness.

## Operational Model

CargoGuardian is built around one train = one embedded ESP32 hardware unit.

Primary hardware signals:

- weight sensor
- GPS
- RFID
- clearance LED
- weight warning state (`-1 underweight`, `0 safe`, `1 overweight`)

Key workflow:

1. Admin creates a device in Blynk from the `CargoGuardian ESP32` template.
2. Admin sets the Blynk device name exactly equal to the train code.
3. Admin copies that device Auth Token and links it during Add Train in CargoGuardian.
4. The ESP32 is flashed with that Auth Token.
5. The template webhook forwards telemetry to CargoGuardian.
6. Worker can inspect assigned trains before clearance.
7. Master or admin grants clearance remotely or through RFID-backed workflow.
8. Once cleared, worker should no longer see that train.
9. During transit, CargoGuardian will use GPS and weight changes to detect incidents.

## Authentication Model

- Normal signup supports email/password and Google.
- Normal signup creates a Firestore user profile with role `not-set`.
- Users with role `not-set` are redirected to `/onboarding` and cannot access protected app routes or APIs until they choose `worker` or `master`.
- The special `/admin-invite?code=...` flow uses its own admin-only signup endpoint, validates the invite code again on POST, creates the account directly as `admin`, and skips role selection.
- The old `roleSelected` profile flag is no longer required for new auth state.

## How Blynk Connects To CargoGuardian

CargoGuardian uses Blynk in two directions.

- inbound telemetry:
  - Blynk device name must match `train.code`
  - the template webhook posts datastream snapshots to `/api/telemetry/ingest`
  - CargoGuardian resolves the train by code and writes telemetry into Firestore
- outbound device commands:
  - CargoGuardian uses the train's stored per-device Blynk Auth Token
  - server-side Blynk device API writes can update datastreams such as `clearanceLed`
  - server-side Blynk connection-status reads can force the UI to show a linked train as offline when Blynk reports the hardware disconnected
  - the browser must never call Blynk directly

## Blynk Configuration

Required server variables:

```env
BLYNK_BASE_URL=https://blynk.cloud
BLYNK_MQTT_URL=
BLYNK_WEBHOOK_SECRET=
BLYNK_TEMPLATE_ID=TMPL3TPA6EnbV
BLYNK_TEMPLATE_NAME=CargoGuardian ESP32
DEMO_BLYNK_AUTH_TOKEN=
```

`BLYNK_AUTH_TOKEN` is no longer part of the server setup. Device Auth Tokens belong to individual Blynk devices and are pasted into CargoGuardian during Add Train.
`BLYNK_MQTT_URL` is optional and can be used to force the demo simulator to a specific raw Blynk MQTT/TLS endpoint such as `mqtts://ny3.blynk.cloud:8883`.

For diagnostics, CargoGuardian now also exposes an authenticated server route that reads the current Blynk values for one linked train:

```text
GET /api/trains/[trainId]/blynk/current
```

This reads Blynk directly with the stored train token and is useful when the webhook path is misconfigured. It does not replace the webhook ingest architecture.

## Demo Mode Policy

Demo controls are available when `DEMO_BLYNK_AUTH_TOKEN` is configured on the server.

- when configured: the browser exposes demo controls and can trigger server-side demo publishing while the page is open
- when missing: only real hardware telemetry is shown

The Blynk template webhook remains the only ingest path into CargoGuardian, including for demo publishing.
The demo Blynk device still has to follow the same normal rule as any real device: its device name must equal the target `train.code`.
The deployed demo publisher opens a short raw Blynk MQTT/TLS device session on each tick so the demo device behaves more like real hardware and can appear online in Blynk while running.
The MQTT publisher now follows Blynk redirect instructions and logs broker-level failures, but deployed environments can still require an explicit regional `BLYNK_MQTT_URL` if the default global broker host is not stable for that runtime.
Demo publishing is stopped by default on page load. It starts only after `start` and stops after `stop` or when the page session ends.

The UI must not switch to fake train lists, fake counts, or special demo-only presentation.

When the demo device is configured, logged-in users can control demo publishing from the browser console with:

Type these directly in the browser console:

```js
start
stop
under
safe
over
status
```

The `window.demo(...)` commands still work, but the short aliases are the intended console controls.

## Map Policy

The project should not depend on paid Mapbox usage or any credit-card-gated mapping requirement.

Future map work should use a free stack such as:

- OpenStreetMap tiles
- Leaflet or another free client library

The route plan should distinguish:

- planned source/destination path geometry stored in Firestore
- actual traveled GPS breadcrumbs derived from telemetry history

The current map route can stay placeholder until that phase is implemented.

## Local Development

```bash
npm install
npm run dev
```

Normal demo usage does not need a separate simulator terminal. Open the app, then use the browser console commands:

```js
start
stop
under
safe
over
status
```

Only if you explicitly want the old standalone simulator path:

```bash
npm run simulate:devices
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Firestore Indexes

The repo now includes the required composite index definition for telemetry history in [firestore.indexes.json](./firestore.indexes.json).

Create that Firestore index in your project so `telemetry_history` queries on `trainId + createdAt` do not fall back to slower unordered scans.

## Planning Docs

- [AGENTS.md](./AGENTS.md)
- [Phase Index](./docs/implementation/PHASE_INDEX.md)
- [How To Continue](./docs/implementation/HOW_TO_CONTINUE.md)
- [Global TODO](./docs/implementation/GLOBAL_TODO.md)
- [Phase 1 - Project Initialization](./docs/implementation/phase-01-project-initialization.md)

## Supporting Docs

- [Blynk Setup Guide](./docs/blynk-setup.md)
- [Device Connection Guide](./docs/device-connection.md)
