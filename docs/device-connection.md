# Device Connection Guide

This document explains how device connection works after Blynk has already been set up.

If you need the click-by-click Blynk console steps, read [Blynk Setup Guide](./blynk-setup.md) first.

## Architecture

All telemetry follows the same path:

```text
ESP32 sensors or demo simulator
  -> Blynk Cloud
    -> Blynk template webhook
      -> POST /api/telemetry/ingest
        -> Firestore telemetry_current
        -> Firestore telemetry_history
        -> CargoGuardian UI
```

The deployed app can trigger demo publishing through browser console controls, and it publishes each tick through a short raw Blynk MQTT/TLS device session so the demo device behaves more like real hardware. For normal demo use, you do not need any separate simulator terminal. The optional local simulator still exists only for explicit manual fallback testing.

Device control flows in the opposite direction:

```text
CargoGuardian server action
  -> Blynk Device HTTPS API using the train's stored Auth Token
    -> Blynk Cloud
      -> ESP32 virtual pin handler
```

Use that path for remote commands such as switching the clearance light. Do not call Blynk directly from the browser.

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
- remote commands should use the stored train `blynkAuthToken` through server-side Blynk device API calls

## Required Server Env

```env
BLYNK_BASE_URL=https://blynk.cloud
BLYNK_MQTT_URL=
BLYNK_WEBHOOK_SECRET=
BLYNK_TEMPLATE_ID=TMPL3TPA6EnbV
BLYNK_TEMPLATE_NAME=CargoGuardian ESP32
DEMO_BLYNK_AUTH_TOKEN=
```

Important:

- `BLYNK_AUTH_TOKEN` is not part of the server setup anymore
- device Auth Tokens are per-device and are entered in Add Train
- `DEMO_BLYNK_AUTH_TOKEN` is only for the local demo simulator device session
- `BLYNK_MQTT_URL` is optional and can force the simulator to a specific raw Blynk MQTT/TLS endpoint such as `mqtts://ny3.blynk.cloud:8883`

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
  "weightKg": "{device_dataStream_V0}",
  "gpsLat": "{device_dataStream_V1}",
  "gpsLng": "{device_dataStream_V2}",
  "clearanceLed": "{device_dataStream_V3}",
  "weightWarningState": "{device_dataStream_V4}",
  "rfidLastScan": "{device_dataStream_V5}",
  "rfidLastTag": "{device_dataStream_V6}",
  "signalStrength": "{device_dataStream_V7}"
}
```

HTTP header:

- `Authorization: Bearer <BLYNK_WEBHOOK_SECRET>`

Why the numeric fields are quoted:

- it keeps the JSON valid even when a datastream is still empty during webhook testing
- CargoGuardian now parses number-like and boolean-like strings on ingest

Recommended webhook setup:

- create one webhook per important datastream trigger:
  - `weightKg`
  - `gpsLat`
  - `gpsLng`
  - `clearanceLed`
  - `weightWarningState`
  - `rfidLastScan`
  - `rfidLastTag`
  - `signalStrength`
- each webhook can send the same full JSON body above to `/api/telemetry/ingest`
- this avoids a design where CargoGuardian only updates when `V0` changes

Common webhook failure reasons:

- `Authorization` header does not exactly match `BLYNK_WEBHOOK_SECRET`
- the webhook URL points to the wrong deployment domain
- the Blynk device name does not exactly match CargoGuardian `train.code`
- one or more unquoted numeric placeholders are empty, which breaks JSON
- the train exists in Blynk but not in CargoGuardian
- the device has never written the datastream values being referenced

Device online status:

- actual webhook delivery depends on a real datastream update happening
- that usually means the device must be online to send new values
- but the Blynk template "Test Webhook" button can still fail for payload or endpoint reasons even if the device is online

Diagnostics:

- `GET /api/trains/[trainId]/blynk/current` reads the live Blynk connection status and current datastream values using the train's stored Auth Token
- use it to check whether Blynk is receiving data even when the webhook path is broken

Firestore index requirement:

- `telemetry_history` queries use `trainId` plus `createdAt desc`
- the required composite index is committed in `firestore.indexes.json`
- until that index exists in Firestore, CargoGuardian falls back to a slower unordered scan for that train

## GPS Fallback

If the payload omits GPS values, CargoGuardian can fall back to:

- `DEFAULT_GPS_LAT`
- `DEFAULT_GPS_LNG`

This is useful for hackathon demos when the GPS module is not ready yet.

## Demo Simulator

The normal demo path is browser-controlled and does not require a separate terminal process.

The optional standalone MQTT simulator still lives at `scripts/demo-device-simulator/index.ts`.

Rules:

- it runs when the demo device is configured
- it does not read telemetry values from Firestore
- it generates its own GPS, weight, RFID, and warning-state values
- it publishes those values to Blynk using `DEMO_BLYNK_AUTH_TOKEN`
- the publisher follows Blynk redirect instructions, but some deployments can still need an explicit regional `BLYNK_MQTT_URL`
- CargoGuardian receives those values only when the Blynk template webhook calls `/api/telemetry/ingest`
- the demo Blynk device name must still equal the target `train.code`
- it must behave like the real hardware model, not invent a separate demo schema
- the deployed app starts in stopped state and only publishes after `start`
- the optional local `npm run simulate:devices` script is still available when you explicitly want a local MQTT device session

## Demo Control From Browser Console

When the demo device is configured, any logged-in user can control the demo train state from the browser console:

```js
start
stop
under
safe
over
status
```

Meaning:

- `start` -> start demo publishing
- `stop` -> stop demo publishing
- `under` -> underweight
- `safe` -> safe
- `over` -> overweight
- `status` -> request current demo runtime state

Important:

- the short aliases above are the intended controls
- the older `window.demo(...)` commands still work
