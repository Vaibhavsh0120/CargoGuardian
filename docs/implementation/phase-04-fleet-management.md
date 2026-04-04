# Phase 4 - Fleet and Train Management

## Overview

Phase 4 established Train as the primary business entity across the app shell. It delivered fleet browsing, train detail, Add Train, and the first access-control layer.

This phase is complete.

## Delivered

- `/fleet`
- `/fleet/[trainId]`
- `/trains/new`
- Firestore-backed train list and train detail
- dashboard summary based on train records
- admin-only Add Train flow
- `trainAssignments` and `accessRequests` foundations
- role-scoped train visibility

## Locked Rules From This Phase

- Admin sees every train.
- Master sees trains they own or are actively assigned.
- Worker sees assigned trains only while the train remains pre-clearance.
- Revoked assignments do not count as active access.
- Master can manage worker access only for trains they manage.

## APIs In Scope

- `GET /api/trains`
- `POST /api/trains`
- `GET /api/trains/[trainId]`
- `GET /api/trains/[trainId]/summary`
- `GET /api/trains/assignments`
- `POST /api/trains/access/request`
- `GET /api/trains/access/requests`
- `POST /api/trains/access/grant`
- `POST /api/trains/access/revoke`
- `POST /api/trains/access/[requestId]/approve`
- `POST /api/trains/access/[requestId]/reject`
- `POST /api/trains/[trainId]/delegate`

## Implementation Notes

Post-phase correction work tightened this phase so it matches the real product:

1. Worker visibility is now clearance-scoped instead of plain assignment-scoped.
2. Revoked assignments no longer count as active access.
3. Masters can now approve or reject worker requests for trains they manage.
4. Shared train state now includes:
   - `clearanceStatus`
   - `clearanceGrantedAt`
   - `clearanceGrantedBy`
   - `clearanceMethod`
   - `journeyStage`
   - `weightStatus`
5. Non-admin UI surfaces no longer advertise Add Train actions.

## Deferred

- Access-management UI remains deferred to a later phase.
- Clearance actions remain deferred to a later phase.
- Rich telemetry cards remain deferred to Phase 6.
