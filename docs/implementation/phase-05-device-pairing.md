# Phase 5 - Device Pairing and Hardware Management

## Overview

Phase 5 is complete.

The final Phase 5 workflow is the free-plan Blynk workflow:

- Train = Device
- Blynk device is created manually in Blynk Console from the shared template
- Add Train links that Blynk device to CargoGuardian
- telemetry enters through `/api/telemetry/ingest`
- the simulator uses the same ingest route

## Delivered

- manual Blynk device linking during train creation
- Add Train collects:
  - train metadata
  - Blynk Auth Token
  - optional Blynk device id
- train document stores:
  - `blynkProvisioningStatus`
  - `blynkProvisioningError`
  - `blynkTemplateId`
  - `blynkTemplateName`
  - `blynkAuthToken`
  - `blynkDeviceId`
  - `firmware`
  - `lastSeen`
- telemetry ingest foundation
- local simulator that targets one dedicated demo train code

## Required Operator Workflow

1. In Blynk Console, create a device from the `CargoGuardian ESP32` template.
2. Set the Blynk device name exactly equal to the train code.
3. Copy the device Auth Token.
4. Open Add Train in CargoGuardian.
5. Enter the train metadata and paste the Auth Token.
6. Save the train.
7. Flash the same Auth Token into the ESP32 firmware.

## Hardware Semantics Locked By This Phase

Primary operational signals:

- weight
- GPS
- RFID
- clearance LED
- weight warning state (`-1 underweight`, `0 safe`, `1 overweight`)

Compatibility note:

- telemetry ingest still accepts legacy `errorLed` and color aliases for compatibility
- real hardware and simulator payloads should use `weightWarningState`

## Data Flow

1. Admin links the manually created Blynk device during Add Train.
2. The template webhook posts telemetry to CargoGuardian.
3. The webhook sends `deviceId`, which is the Blynk device name.
4. CargoGuardian resolves the train by `train.code`.
5. CargoGuardian writes `telemetry_current` and `telemetry_history`.

## Post-Phase Correction Notes

Earlier AI-generated work assumed server-side auto-creation of Blynk devices using a generic account token. That path was removed because it does not match the free-plan workflow the project can actually rely on.

Future phases must assume:

- Blynk device creation is manual
- Add Train links the device, it does not create it
- the Blynk device name must equal the train code
- the template webhook is the connection point between Blynk and CargoGuardian
- demo mode should target exactly one demo train whose code or label contains `DEMO`

## Deferred

- Current telemetry read APIs and UI belong to Phase 6.
- Clearance actions and incident alerts belong to Phase 7.
- Train deletion still needs to include Blynk cleanup guidance.
