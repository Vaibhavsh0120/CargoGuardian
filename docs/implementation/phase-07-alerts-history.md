# Phase 7 - Alerts and Event History

## Phase Overview

This phase adds operational awareness: anomalies, active issues, and historical event trails. Once telemetry exists, the system needs to surface actionable alerts and let operators inspect what happened over time.

This phase should connect threshold events, device-state issues, and manually updated alert status into a consistent alert feed and history timeline.

## Objectives

- Implement alert feed and detail interactions.
- Implement alert lifecycle actions.
- Implement operational history page.
- Write events for important system actions.
- Connect alert generation to telemetry and device conditions.

## Required Features

- Alerts page with severity filters and active/resolved states
- Train-scoped alert panels on Train Detail
- Acknowledge alert action
- Resolve alert action
- History page with train/device/category filters
- Event timeline for train and device workflows
- Dashboard recent-alert summary rail

## Files To Create

- `app/(app)/alerts/loading.tsx`
- `app/(app)/history/loading.tsx`
- `features/alerts/components/AlertList.tsx`
- `features/alerts/components/AlertFilters.tsx`
- `features/alerts/components/AlertDetailPanel.tsx`
- `features/alerts/components/AlertSeverityBadge.tsx`
- `features/alerts/hooks/useAlerts.ts`
- `features/alerts/hooks/useAlertActions.ts`
- `features/alerts/services/alerts-client.ts`
- `features/history/components/HistoryFilters.tsx`
- `features/history/components/HistoryTable.tsx`
- `features/history/components/EventTimeline.tsx`
- `features/history/hooks/useHistory.ts`
- `features/history/services/history-client.ts`
- `services/alerts/read.ts`
- `services/alerts/write.ts`
- `services/alerts/lifecycle.ts`
- `services/history/read.ts`
- `lib/validation/alerts.ts`
- `types/alert.ts`
- `types/event.ts`

## Files To Update

- `app/(app)/alerts/page.tsx`
- `app/(app)/history/page.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/fleet/[trainId]/page.tsx`

## Components To Build

- `AlertList`
- `AlertFilters`
- `AlertDetailPanel`
- `AlertSeverityBadge`
- `HistoryFilters`
- `HistoryTable`
- `EventTimeline`
- train-detail `TrainAlertPanel`
- dashboard `RecentAlertsRail`

## APIs To Implement

- `GET /api/alerts`
- `GET /api/alerts/[alertId]`
- `POST /api/alerts/[alertId]/acknowledge`
- `POST /api/alerts/[alertId]/resolve`
- `GET /api/history`

## Services To Implement

- Alert query service
- Alert lifecycle mutation service
- Threshold alert evaluator
- Device-state alert evaluator
- Event logging service
- History read service

## Data Flow

1. Telemetry ingestion or device state changes trigger alert evaluation.
2. Alert service creates or updates `alerts` documents.
3. Event service appends to `events` collection.
4. Alerts page reads `GET /api/alerts`.
5. Train detail reads train-filtered alerts.
6. Acknowledge/resolve actions mutate alert status server-side and append event + audit records.
7. History page reads `GET /api/history` with train/device/date filters.

## UI Pages Affected

- `/alerts`
- `/history`
- `/dashboard`
- `/fleet/[trainId]`

## Integration Points

- Firestore `alerts`
- Firestore `events`
- Firestore `auditLogs`
- telemetry snapshot and history from Phase 6
- device state from Phase 5

## Dependencies

- Depends on Phase 6.
- Must complete before analytics-generated alerts in Phase 9 can integrate into the same UI.

## Validation Checklist

- Threshold alert is created from telemetry condition.
- Device offline alert is created from missing heartbeat or stale telemetry.
- Alerts page lists active alerts correctly.
- Acknowledge changes alert status and persists actor info.
- Resolve changes alert status and persists timestamps.
- History page shows resulting operational events.
- Dashboard recent alert summary updates correctly.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deliverables

- Real alerts page
- Alert lifecycle actions
- Real history page
- Event logging pipeline
- Train-specific alert/history panels

## Hackathon Priority

**Critical for demo**

Operators need to see alerts and history for the product to feel operationally credible.
