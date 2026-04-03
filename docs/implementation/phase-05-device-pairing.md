# Phase 5 - Device Pairing and Hardware Management

## Phase Overview

This phase introduces the hardware side of CargoGuardian. It turns the devices area from a placeholder into a real operational screen, adds the pair-device workflow, and establishes device assignment as a durable lifecycle record instead of a UI-only action.

By the end of this phase, the app should manage ESP32 inventory, link a device to a train, prevent conflicting assignments, and store assignment history for later telemetry, alert, and audit workflows.

## Objectives

- Implement device inventory screen.
- Implement device detail screen.
- Implement pair-device wizard.
- Implement assignment and unassignment flows.
- Persist device assignment lifecycle in Firestore.
- Validate device codes against Blynk-facing metadata or a documented stub path.

## Required Features

- Device table with search and status filters
- Device detail card
- Pairing wizard with:
  - train selection
  - device code entry
  - verification state
  - assignment confirmation
- Unassign flow
- Assignment history view
- Train detail device panel that reflects current assignment

## Files To Create

- `app/(app)/devices/loading.tsx`
- `app/(app)/devices/pair/page.tsx`
- `app/(app)/devices/[deviceId]/page.tsx`
- `features/devices/components/DeviceTable.tsx`
- `features/devices/components/DeviceFilters.tsx`
- `features/devices/components/DeviceDetailCard.tsx`
- `features/devices/components/DeviceAssignmentHistory.tsx`
- `features/devices/components/PairingWizard.tsx`
- `features/devices/components/PairingStepTrain.tsx`
- `features/devices/components/PairingStepCode.tsx`
- `features/devices/components/PairingStepVerify.tsx`
- `features/devices/components/PairingStepComplete.tsx`
- `features/devices/hooks/useDevices.ts`
- `features/devices/hooks/useDevice.ts`
- `features/devices/hooks/usePairDevice.ts`
- `features/devices/hooks/useUnassignDevice.ts`
- `features/devices/services/device-client.ts`
- `services/devices/read.ts`
- `services/devices/write.ts`
- `services/devices/assignments.ts`
- `services/blynk/pairing.ts`
- `lib/validation/devices.ts`
- `types/device.ts`
- `types/device-assignment.ts`

## Files To Update

- `app/(app)/devices/page.tsx`
- `app/(app)/fleet/[trainId]/page.tsx`
- `types/train.ts`
- `README.md` if setup notes change

## Components To Build

- `DeviceTable`
- `DeviceFilters`
- `DeviceDetailCard`
- `DeviceAssignmentHistory`
- `PairingWizard`
- `DeviceStatusBadge`
- `AssignmentStateBadge`
- train-detail `DeviceAssignmentPanel`

## APIs To Implement

- `GET /api/devices`
- `GET /api/devices/[deviceId]`
- `POST /api/devices/pair`
- `POST /api/devices/[deviceId]/assign`
- `POST /api/devices/[deviceId]/unassign`

Notes:
- keep assignment writes on the server
- use transactional updates for device + train + assignment record consistency

## Services To Implement

- Device read service
- Device write service
- Assignment transaction service
- Blynk device-code validation service
- Audit logging helper for assignment mutations

## Data Flow

1. Devices page loads `GET /api/devices`.
2. Pairing wizard collects train and device code.
3. Frontend posts to `/api/devices/pair`.
4. API route validates payload and checks auth/role.
5. Assignment service verifies device state and device-code ownership.
6. Transaction updates:
   - `devices/{deviceId}`
   - `trains/{trainId}`
   - `deviceAssignments/{assignmentId}`
   - `events`
   - `auditLogs`
7. UI invalidates devices, fleet, train detail, and selector caches.

## UI Pages Affected

- `/devices`
- `/devices/pair`
- `/devices/[deviceId]`
- `/fleet/[trainId]`

## Integration Points

- Firestore `devices`
- Firestore `deviceAssignments`
- Firestore `trains`
- Blynk device registry or validation endpoint
- Firestore `auditLogs`
- Firestore `events`

## Dependencies

- Depends on Phase 4 because devices must attach to real trains.
- Must complete before Phase 6 because telemetry requires an active device-to-train relationship.

## Validation Checklist

- Devices page lists inventory correctly.
- Pairing fails for invalid codes.
- Pairing fails for already-active conflicting assignments.
- Pairing succeeds for a valid unassigned device.
- Device detail reflects new assignment state.
- Train detail reflects active device state.
- Unassign flow updates both train and device state.
- Assignment history is preserved and queryable.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deliverables

- Real devices page
- Pairing wizard
- Assignment transaction service
- Device detail route
- Assignment history persistence

## Hackathon Priority

**Critical for demo**

Pairing a device is one of the required showcase workflows and must be functional for the demo storyline.
