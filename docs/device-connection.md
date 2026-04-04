# Device Connection Guide

This document explains how device connection works after Blynk has already been set up.

If you need the click-by-click Blynk console steps, read [Blynk Setup Guide](./blynk-setup.md) first.

## Architecture

All telemetry follows the same path:

```text
ESP32 sensors
  -> Blynk Cloud
    -> Blynk template webhook
      -> POST /api/telemetry/ingest
        -> Firestore telemetry_current
        -> Firestore telemetry_history
        -> CargoGuardian UI
```

The local simulator uses the same ingest endpoint. It changes only the telemetry source, not the app data path.

## Source Of Truth

- Train = Device
- there is no separate `devices` collection
- Blynk device creation happens manually in Blynk Console
- Add Train links that already-created Blynk device to CargoGuardian
- the Blynk device name must exactly match the train code

Train documents store:

- `blynkProvisioningStatus`
- `blynkProvisioningError`
- `blynkTemplateId`
- `blynkTemplateName`
- `blynkAuthToken`
- `blynkDeviceId`
- `firmware`
- `lastSeen`

## Device Linking Workflow

1. Open Blynk Console.
2. Create a new device from the `CargoGuardian ESP32` template.
3. Set the Blynk device name exactly equal to the train code you want in CargoGuardian.
4. Open that Blynk device and copy its Auth Token.
5. Optionally copy the Blynk device id.
6. Open Add Train in CargoGuardian.
7. Enter the train details and paste the Auth Token.
8. Save the train.
9. Flash the same Auth Token into the ESP32.

Hackathon recommendation:

- keep one dedicated demo train only, for example `CG-DEMO-01`
- keep that demo train separate from real operating trains

This is how Blynk connects to CargoGuardian:

- the template webhook sends telemetry to CargoGuardian
- CargoGuardian resolves the train by `train.code`
- because the Blynk device name equals the train code, telemetry lands on the correct train

## Required Server Env

```env
BLYNK_BASE_URL=https://blynk.cloud
BLYNK_WEBHOOK_SECRET=
BLYNK_TEMPLATE_ID=TMPL3TPA6EnbV
BLYNK_TEMPLATE_NAME=CargoGuardian ESP32
```

Important:

- `BLYNK_AUTH_TOKEN` is not part of the server setup anymore
- device Auth Tokens are per-device and are entered in Add Train

## Primary Hardware Signals

The real operational payload should be based on:

- `weightKg`
- `gpsLat`
- `gpsLng`
- `rfidLastScan`
- `rfidLastTag`
- `clearanceLed`
- `weightWarningState`

Semantics:

- `weightWarningState = -1` -> underweight / device blinks locally
- `weightWarningState = 0` -> safe / light off
- `weightWarningState = 1` -> overweight / device stays on locally

Derived in CargoGuardian:

- `speedKmh`
- freshness / offline state
- movement state

Compatibility note:

- the ingest route still tolerates legacy `errorLed` and `weightWarningLightColor` aliases
- real hardware and the simulator should use `weightWarningState`

## Recommended Blynk Template Fields

| Name | Pin | Type |
| --- | --- | --- |
| `weightKg` | `V0` | Double |
| `gpsLat` | `V1` | Double |
| `gpsLng` | `V2` | Double |
| `clearanceLed` | `V3` | Integer |
| `weightWarningState` | `V4` | Integer |
| `rfidLastScan` | `V5` | String |
| `rfidLastTag` | `V6` | String |
| `signalStrength` | `V7` | Integer |

## Webhook Body

```json
{
  "deviceId": "{device_name}",
  "weightKg": {device_dataStream_V0},
  "gpsLat": {device_dataStream_V1},
  "gpsLng": {device_dataStream_V2},
  "clearanceLed": {device_dataStream_V3},
  "weightWarningState": {device_dataStream_V4},
  "rfidLastScan": "{device_dataStream_V5}",
  "rfidLastTag": "{device_dataStream_V6}",
  "signalStrength": {device_dataStream_V7}
}
```

HTTP header:

- `Authorization: Bearer <BLYNK_WEBHOOK_SECRET>`

## GPS Fallback

If the payload omits GPS values, CargoGuardian can fall back to:

- `DEFAULT_GPS_LAT`
- `DEFAULT_GPS_LNG`

This is useful for hackathon demos when the GPS module is not ready yet.

## Demo Simulator

The simulator lives at `scripts/demo-device-simulator/index.ts`.

Rules:

- it only runs when `NEXT_PUBLIC_DEMO_MODE=true`
- it looks for one train whose code or label contains `DEMO`
- it reads that train record only to learn which train code to target
- it does not read telemetry values from Firestore
- it generates its own GPS, weight, RFID, and warning-state values
- it can mirror those same values into the demo Blynk device when the train has a saved Auth Token
- it sends telemetry to `/api/telemetry/ingest`
- it must behave like the real hardware model, not invent a separate demo schema

## Demo Control From Browser Console

When demo mode is enabled, any logged-in user can control the demo train state from the browser console:

```js
window.cgDemo.setWeightWarningState(-1)
window.cgDemo.setWeightWarningState(0)
window.cgDemo.setWeightWarningState(1)
```

Meaning:

- `-1` -> underweight
- `0` -> safe
- `1` -> overweight

Important:

- typing bare `-1`, `0`, or `1` in the console does not control the simulator
- use `window.cgDemo.setWeightWarningState(...)`
