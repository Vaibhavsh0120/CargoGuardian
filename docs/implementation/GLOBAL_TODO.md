# Global TODO

This file tracks cross-phase remaining work and product constraints.

## Locked Demo Policy

- No fake trains in the UI
- No fake dashboard counts
- No separate demo data path
- No demo badge or demo banner in the UI
- Demo controls should depend on configured demo-device credentials, not a separate client toggle
- The simulator writes only to Blynk and reaches CargoGuardian only through the normal webhook path
- The demo device still follows the same normal rule as real hardware: Blynk device name must equal `train.code`

## Locked Hardware Model

Primary hardware signals:

- `weightKg`
- `gpsLat`
- `gpsLng`
- `rfidLastScan`
- `rfidLastTag`
- `clearanceLed`
- `weightWarningState`

Primary meanings:

- `weightWarningState = -1` -> underweight / device blinks locally
- `weightWarningState = 0` -> safe / light off
- `weightWarningState = 1` -> overweight / device stays on locally

Derived in CargoGuardian:

- `speedKmh`
- movement state
- freshness / offline state
- clearance state presentation
- theft or cargo-loss suspicion from weight changes during transit

## Locked Access Model

- Admin sees all trains and shared global data.
- Master sees trains they own or are assigned.
- Worker sees assigned trains only before clearance.
- Master can approve or reject worker requests for trains they manage.
- Revoked assignments must not grant visibility.

## Locked Train Model

Train documents must carry at least:

- `clearanceStatus`
- `clearanceGrantedAt`
- `clearanceGrantedBy`
- `clearanceMethod`
- `journeyStage`
- `weightStatus`
- `blynkAuthToken`
- `blynkDeviceId`

## Remaining Core Work

- Build clearance actions and history recording.
- Build access request review UI for admins and masters.
- Build alert rules for:
  - overweight
  - underweight
  - offline hardware
  - significant in-transit weight change
- Build event history timeline.
- Build map view with live train location and incident context.
- Build analytics around cargo risk, route efficiency, and incident patterns.
- Add train deletion flow that also deletes the Blynk device.

## Documentation Work

- Keep Blynk setup docs aligned with the real payload model.
- Document the recommended per-datastream webhook trigger coverage and the direct Blynk diagnostic route.
- Add backend setup guide for auth credentials and Firestore project configuration.
- Add Firestore indexes/rules guide.
- Add TigerGraph setup guide.
- Add Vercel deployment guide.

## Technical Debt To Monitor

- `CreateTrainInput` and `CreateTrainPayload` are still maintained separately.
- Telemetry payload compatibility currently tolerates legacy `errorLed` and `weightWarningLightColor` aliases; real hardware should use `weightWarningState`.
- Access-control UI is not built yet even though the APIs exist.
