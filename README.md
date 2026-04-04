# CargoGuardian

CargoGuardian is a dashboard-first rail cargo clearance and monitoring platform built with Next.js 15, React 19, TypeScript, Tailwind CSS, Firebase, Blynk, free map tooling, Recharts, and TigerGraph.

## Current Status

- Phases 1, 2, 3, 4, and 5 are complete.
- Phase 6 is the next implementation phase.
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
  - access request, approval, rejection, grant, revoke, and delegate APIs
  - telemetry ingest endpoint
  - local simulator that targets one dedicated demo train through the real ingest route

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

The connection point is the template webhook.

- Blynk device name must match `train.code`
- the webhook posts template datastream updates to `/api/telemetry/ingest`
- CargoGuardian resolves the train by code and writes telemetry into Firestore

## Blynk Configuration

Required server variables:

```env
BLYNK_BASE_URL=https://blynk.cloud
BLYNK_WEBHOOK_SECRET=
BLYNK_TEMPLATE_ID=TMPL3TPA6EnbV
BLYNK_TEMPLATE_NAME=CargoGuardian ESP32
```

`BLYNK_AUTH_TOKEN` is no longer part of the server setup. Device Auth Tokens belong to individual Blynk devices and are pasted into CargoGuardian during Add Train.

## Demo Mode Policy

`NEXT_PUBLIC_DEMO_MODE` only controls whether the simulator sends telemetry.

- `true`: the simulator looks for one train whose code or label contains `DEMO`, generates demo telemetry for it, and posts to `/api/telemetry/ingest`
- `false`: only real hardware telemetry is shown

The UI must not switch to fake train lists, fake counts, or special demo-only presentation.

In demo mode, logged-in users can control the demo train warning state from the browser console with:

```js
window.cgDemo.setWeightWarningState(-1 | 0 | 1)
```

## Map Policy

The project should not depend on paid Mapbox usage or any credit-card-gated mapping requirement.

Future map work should use a free stack such as:

- OpenStreetMap tiles
- Leaflet or another free client library

The current map route can stay placeholder until that phase is implemented.

## Local Development

```bash
npm install
npm run dev
```

To run the simulator manually:

```bash
npm run simulate:devices
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

## Planning Docs

- [AGENTS.md](./AGENTS.md)
- [Phase Index](./docs/implementation/PHASE_INDEX.md)
- [How To Continue](./docs/implementation/HOW_TO_CONTINUE.md)
- [Global TODO](./docs/implementation/GLOBAL_TODO.md)

## Supporting Docs

- [Blynk Setup Guide](./docs/blynk-setup.md)
- [Device Connection Guide](./docs/device-connection.md)
