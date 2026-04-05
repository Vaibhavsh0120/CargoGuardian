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
BLYNK_MQTT_URL=
BLYNK_WEBHOOK_SECRET=
BLYNK_TEMPLATE_ID=TMPL3TPA6EnbV
BLYNK_TEMPLATE_NAME=CargoGuardian ESP32
DEMO_BLYNK_AUTH_TOKEN=
```

Important:

- `BLYNK_WEBHOOK_SECRET` is your own secret between Blynk webhook and CargoGuardian
- `BLYNK_AUTH_TOKEN` is not a server env var anymore
- each Blynk device has its own Auth Token
- `DEMO_BLYNK_AUTH_TOKEN` is only for the local demo simulator and should be the Auth Token of the dedicated demo Blynk device
- `BLYNK_MQTT_URL` is optional and only needed if you want to force the simulator to a specific raw Blynk MQTT/TLS broker such as `mqtts://ny3.blynk.cloud:8883` instead of the default derived from `BLYNK_BASE_URL`

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
4. Datastream:
   - if your Blynk plan allows multiple webhooks, create one webhook per important datastream and reuse the same body
   - if your Blynk plan allows only one webhook, trigger it from a frequently updated datastream such as `weightKg`
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
  "weightKg": "{device_dataStream_1}",
  "gpsLat": "{device_dataStream_2}",
  "gpsLng": "{device_dataStream_3}",
  "clearanceLed": "{device_dataStream_4}",
  "weightWarningState": "{device_dataStream_5}",
  "rfidLastScan": "{device_dataStream_6}",
  "rfidLastTag": "{device_dataStream_7}",
  "signalStrength": "{device_dataStream_8}"
}
```

How this works:

- Blynk sends `device_name`
- CargoGuardian matches that to `train.code`
- `device_dataStream_X` uses the datastream identifier, not the pin name
- on free Blynk, one webhook can still send the full telemetry snapshot when it is triggered by a frequently updated datastream such as `weightKg`
- so the Blynk device name must exactly match the train code

Recommended trigger coverage:

- paid-plan recommendation:
  - create one webhook per important datastream
  - each webhook can point to the same URL and send the same full body
- free-plan workaround:
  - create one webhook only
  - trigger it from a frequently changing datastream such as `weightKg`
  - send the full snapshot using `device_dataStream_<datastreamId>` placeholders

Why the numeric placeholders are quoted:

- it keeps the payload valid JSON even when a datastream is blank during testing
- CargoGuardian will coerce number-like and boolean-like strings on ingest

Common reasons "Test Webhook" fails:

- wrong `Authorization` header or secret mismatch
- wrong deployment URL
- the endpoint returns `404` because `device_name` does not match a train code
- the datastream identifiers in `device_dataStream_X` do not match the real Blynk datastream ids
- the datastream type in Blynk does not match the actual value format

Being online is necessary for real datastream updates, but not enough by itself to make the test pass. A bad payload or a rejected endpoint will still fail.

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
- CargoGuardian can also send direct server-side device commands back to Blynk with that stored Auth Token

## 6. Flash The ESP32

Flash the same Blynk Auth Token into the ESP32 firmware.

That token is what connects the real hardware to the Blynk device you created.

## 7. Create The Demo Train In Blynk

Keep one dedicated demo train only.

Recommended setup:

- choose one dedicated Blynk device for the simulator
- make that Blynk device name exactly equal to the CargoGuardian train code
- use that device's Auth Token as `DEMO_BLYNK_AUTH_TOKEN`

Steps:

1. create one Blynk device from the same template
2. name it exactly equal to the CargoGuardian train code you want to use
3. copy its Auth Token
4. add the same train in CargoGuardian with the same code
5. paste that Auth Token into Add Train
6. set `DEMO_BLYNK_AUTH_TOKEN` in CargoGuardian

The deployed app does not auto-start demo publishing. It exposes browser console controls that start and stop a demo publisher for the current page session. For normal demo use, no separate simulator terminal is needed.

Important:

- it does not read telemetry values from Firestore
- it then generates simulated GPS, weight, RFID, and warning-state values itself
- it publishes those demo values into Blynk using `DEMO_BLYNK_AUTH_TOKEN`
- in the deployed app, each tick uses a short raw Blynk MQTT/TLS device session so the demo device behaves closer to real hardware and can appear online while running
- the MQTT publisher now follows Blynk redirect instructions, but some deployments can still need an explicit regional `BLYNK_MQTT_URL`
- CargoGuardian then receives the demo telemetry back through the same Blynk webhook path as a real ESP32
- CargoGuardian will only match that telemetry if the Blynk device name equals an existing `train.code`
- the deployed app starts in `stop` state by default
- demo publishing runs only while an open page session has started it

## 8. Direct Device Diagnostics

CargoGuardian now has a direct Blynk diagnostic read path:

```text
GET /api/trains/[trainId]/blynk/current
```

This route:

- checks whether the device is connected in Blynk
- reads the current datastream values directly from Blynk
- uses the train's stored per-device Auth Token on the server

Use it for debugging when the webhook is failing. Keep webhook as the main inbound telemetry path.

## 9. Demo Simulator Behavior

When the demo device is configured and you start it from the browser console:

- the demo publisher keeps working while that page session stays open
- it sends random but realistic telemetry for the dedicated demo train
- it simulates movement using GPS coordinates
- it sends the same field names as the real device
- it pushes the same values into the demo device in Blynk
- CargoGuardian reads that demo telemetry only after Blynk calls the webhook
- it uses `weightWarningState` with:
  - `-1` underweight
  - `0` safe
  - `1` overweight
- when the page session ends, publishing stops because there are no more tick requests

## 10. Demo Control From Browser Console

When the demo device is configured, any logged-in admin, master, or worker can control the demo train from the browser console.

Use:

```js
start
stop
under
safe
over
status
```

Meaning:

- `start` starts demo publishing and resets the device to normal
- `stop` stops demo publishing
- `under` sets the demo train to underweight
- `safe` sets the demo train to safe
- `over` sets the demo train to overweight
- `status` asks CargoGuardian for the current demo runtime state

How it works:

- the browser sends the selected state to CargoGuardian
- CargoGuardian stores that demo-control value on the server
- while the page session is started, the browser triggers server-side demo ticks
- each tick generates GPS movement and the rest of the demo telemetry
- each tick publishes those values into Blynk with `DEMO_BLYNK_AUTH_TOKEN`
- CargoGuardian receives the resulting telemetry through the Blynk webhook

Important:

- use the short aliases above
- the older `window.demo(...)` commands still work
- the deployed app demo publisher is different from the optional local `npm run simulate:devices` MQTT simulator
