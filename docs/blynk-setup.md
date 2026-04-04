# Blynk Setup Guide

This guide shows the simplest working Blynk setup for CargoGuardian.

Use it in this order:

1. create the Blynk template
2. create the webhook
3. create the Blynk device
4. add the same train in CargoGuardian
5. flash the same Auth Token into the ESP32

## 1. Required Env In CargoGuardian

Set these on your local machine and on Vercel:

```env
BLYNK_BASE_URL=https://blynk.cloud
BLYNK_WEBHOOK_SECRET=
BLYNK_TEMPLATE_ID=TMPL3TPA6EnbV
BLYNK_TEMPLATE_NAME=CargoGuardian ESP32
```

Important:

- `BLYNK_WEBHOOK_SECRET` is your own secret between Blynk webhook and CargoGuardian
- `BLYNK_AUTH_TOKEN` is not a server env var anymore
- each Blynk device has its own Auth Token

## 2. Create The Template

In Blynk Console:

1. open `Templates`
2. create or open `CargoGuardian ESP32`
3. use WiFi + ESP32

Create these datastreams:

| Name | Pin | Type | Min | Max | Notes |
| --- | --- | --- | --- | --- | --- |
| `weightKg` | `V0` | Double | `0` | `200000` | current cargo weight |
| `gpsLat` | `V1` | Double | `-90` | `90` | latitude |
| `gpsLng` | `V2` | Double | `-180` | `180` | longitude |
| `clearanceLed` | `V3` | Integer | `0` | `1` | `0` not cleared, `1` cleared |
| `weightWarningState` | `V4` | Integer | `-1` | `1` | `-1` underweight, `0` safe, `1` overweight |
| `rfidLastScan` | `V5` | String | none | none | ISO timestamp string |
| `rfidLastTag` | `V6` | String | none | none | RFID tag id |
| `signalStrength` | `V7` | Integer | `-110` | `0` | WiFi RSSI in dBm |

Important:

- `weightWarningState` should send the logical state only
- blinking stays local in the ESP32
- use:
  - `-1` underweight
  - `0` safe
  - `1` overweight

## 3. Create The Webhook

In Blynk Developer Zone:

1. click `Create New Webhook`
2. Trigger Event: `Template Datastream update`
3. Template: `CargoGuardian ESP32`
4. Datastream: `weightKg`
5. Method: `POST`
6. URL:

```text
https://YOUR_DOMAIN/api/telemetry/ingest
```

7. Add header:

- Key: `Authorization`
- Value: `Bearer YOUR_BLYNK_WEBHOOK_SECRET`

8. Use this JSON body:

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

How this works:

- Blynk sends `device_name`
- CargoGuardian matches that to `train.code`
- so the Blynk device name must exactly match the train code

## 4. Create A Real Train Device In Blynk

1. open `Devices`
2. click `New Device`
3. choose `From Template`
4. select `CargoGuardian ESP32`
5. set the device name equal to the train code
   example: `CG-REAL-01`
6. open the created device
7. copy the `Auth Token`
8. optionally copy the device id too

## 5. Add The Same Train In CargoGuardian

In CargoGuardian:

1. log in as admin
2. open `Add Train`
3. use the same train code you used in Blynk
4. paste the Blynk Auth Token
5. optionally paste the Blynk device id
6. save

Now:

- Blynk knows the device
- CargoGuardian knows the train
- the webhook can land telemetry on the correct train

## 6. Flash The ESP32

Flash the same Blynk Auth Token into the ESP32 firmware.

That token is what connects the real hardware to the Blynk device you created.

## 7. Create The Demo Train In Blynk

Keep one dedicated demo train only.

Recommended naming:

- Blynk device name: `CG-DEMO-01`
- CargoGuardian train code: `CG-DEMO-01`
- CargoGuardian train name: `Demo Train`

Steps:

1. create one Blynk device from the same template
2. name it `CG-DEMO-01`
3. copy its Auth Token
4. add a train in CargoGuardian with code `CG-DEMO-01`
5. paste that Auth Token into Add Train
6. keep `NEXT_PUBLIC_DEMO_MODE=true`

The simulator looks up the one train whose code or label contains `DEMO` and sends telemetry to that train only.

Important:

- it does not read telemetry values from Firestore
- it only reads the train record once so it knows which train code to target
- it then generates simulated GPS, weight, RFID, and warning-state values itself
- if the demo train has a saved Blynk Auth Token, the simulator also mirrors those demo values into the Blynk datastreams

## 8. Demo Simulator Behavior

When demo mode is on:

- the simulator keeps working even if the real ESP32 is offline
- it sends random but realistic telemetry for the dedicated demo train
- it simulates movement using GPS coordinates
- it sends the same field names as the real device
- it can mirror the same values into the demo device in Blynk
- it uses `weightWarningState` with:
  - `-1` underweight
  - `0` safe
  - `1` overweight

## 9. Demo Control From Browser Console

When `NEXT_PUBLIC_DEMO_MODE=true`, any logged-in admin, master, or worker can control the demo train from the browser console.

Use:

```js
window.cgDemo.setWeightWarningState(-1)
window.cgDemo.setWeightWarningState(0)
window.cgDemo.setWeightWarningState(1)
```

Meaning:

- `-1` sets the demo train to underweight
- `0` sets the demo train to safe
- `1` sets the demo train to overweight

How it works:

- the browser sends the selected state to CargoGuardian
- CargoGuardian stores that demo-control value on the server
- the simulator reads that value and applies it to the demo train
- the simulator keeps generating GPS movement and the rest of the demo telemetry
- if the demo train has a Blynk Auth Token, the simulator also mirrors the values into Blynk datastreams

Important:

- typing bare `0`, `-1`, or `1` in the browser console does nothing by itself
- use `window.cgDemo.setWeightWarningState(...)`
