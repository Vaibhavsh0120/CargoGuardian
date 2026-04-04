# Phase 7 - Alerts, Clearance, and Event History

## Phase Overview

This phase adds the operational workflows that make CargoGuardian useful during real cargo movement.

It is not only an alert phase. It must connect:

- alert creation
- clearance actions
- access-request review UI
- event history

## Objectives

- build the alerts page
- build the history page
- build access-request review UI for admins and masters
- build clearance actions for master/admin
- record operational events for important actions

## Required Features

- alerts page with severity and status filters
- train-scoped alerts on train detail
- history page with train and category filters
- admin/master request inbox UI for pending access requests
- worker request submission confirmation UX
- remote clearance action
- RFID-backed clearance event recording
- acknowledge and resolve alert actions

## Core Alert Rules

This phase must support alert logic for:

- overweight (`weightWarningState = 1`)
- underweight (`weightWarningState = -1`)
- offline hardware / stale telemetry
- significant weight change during transit

The in-transit weight-change alert is the core theft/loss signal and should be treated as a high-priority incident workflow.

## Files To Create

- `features/alerts/components/AlertList.tsx`
- `features/alerts/components/AlertFilters.tsx`
- `features/alerts/components/AlertDetailPanel.tsx`
- `features/history/components/HistoryFilters.tsx`
- `features/history/components/HistoryTable.tsx`
- `features/history/components/EventTimeline.tsx`
- `features/access/components/AccessRequestInbox.tsx`
- `features/access/components/AccessRequestActions.tsx`
- `features/clearance/components/ClearanceActionPanel.tsx`
- `services/alerts/read.ts`
- `services/alerts/write.ts`
- `services/alerts/rules.ts`
- `services/history/read.ts`
- `services/events/write.ts`
- `types/alert.ts`
- `types/event.ts`

## Files To Update

- `app/(app)/alerts/page.tsx`
- `app/(app)/history/page.tsx`
- `app/(app)/fleet/[trainId]/page.tsx`
- `app/(app)/dashboard/page.tsx`

## Validation Checklist

- overweight and underweight alerts are created correctly
- stale/offline telemetry produces an offline alert
- in-transit weight change produces an incident alert
- master can review worker requests only for trains they manage
- clearance action records actor, method, and timestamp
- history page shows request, clearance, and alert events
- `npm run lint`, `npm run typecheck`, and `npm run build` pass

## Deliverables

- real alerts page
- request-inbox UI
- clearance action UI
- real history page
- event logging pipeline

## Hackathon Priority

Critical for demo.
