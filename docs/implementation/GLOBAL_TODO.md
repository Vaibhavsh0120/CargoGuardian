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

- Build map view with live train location, source/destination route setup, planned route overlays, actual breadcrumb trails, and incident context.
- Build analytics around cargo risk, route efficiency, incident corridors, and suspicious journey patterns.
- Define the TigerGraph ingestion, query, and Firestore cache pipeline.
- Add train deletion flow that also deletes the Blynk device.

## Documentation Work

- Keep Blynk setup docs aligned with the real payload model.
- Add backend setup guide for auth credentials and Firestore project configuration.
- Add Firestore indexes/rules guide.
- Add TigerGraph setup guide.
- Add Vercel deployment guide.

## Technical Debt To Monitor

- `CreateTrainInput` and `CreateTrainPayload` are still maintained separately.
- Telemetry payload compatibility currently tolerates legacy `errorLed` and `weightWarningLightColor` aliases; real hardware should use `weightWarningState`.
- Phase 7 alert documents are intentionally one active record per train-and-rule pair, with repeated occurrences tracked in the event log rather than separate alert documents.
- The in-transit weight-change alert currently opens when the delta is at least 750 kg and at least 5% of the previous weight; tune this against real hardware behavior if false positives appear.
- Future PWA caching must not hide stale telemetry or delay alert freshness.
- Future map work must keep planned route geometry separate from actual GPS breadcrumbs.
- Access handoff is currently email-address-driven inside the app; if the product later needs notifications, add server-side email delivery rather than client-side messaging.
