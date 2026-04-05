# Phase 7 - Alerts, Clearance, and Event History

## Phase Overview

This phase adds the operational workflows that make CargoGuardian useful during real cargo movement.

It is not only an alert phase. It must connect:

- alert creation
- clearance actions
- access-request review UI
- event history
- branded app identity
- action-first dashboard structure
- installable web-app groundwork with live refresh behavior

## Objectives

- build the alerts page
- build the initial event-history surfaces and the sidebar access workspace that operators use daily
- build access-request review UI for admins and masters
- build clearance actions for master/admin
- record operational events for important actions
- add CargoGuardian app identity and app-icon system used across install surfaces
- restructure the dashboard so the most urgent operational work is visible first
- introduce the installable web-app foundation so the site can be added to a phone home screen
- reduce avoidable query waterfalls by using async parallel reads and writes where safe

## Required Features

- alerts page with severity and status filters
- train-scoped alerts on train detail
- role-based access workspace in the protected shell
- admin/master request inbox UI for pending access requests
- worker request submission confirmation UX
- remote clearance action
- RFID-backed clearance event recording
- acknowledge and resolve alert actions
- branded app identity, app name metadata, and app icons
- manifest-driven install support for mobile and desktop browsers
- live refresh behavior on dashboard, alerts, history, and train detail so normal use does not depend on manual reload
- dashboard restructure around action queue, incidents, stale/offline trains, transit watch, and recent operational events
- async service orchestration that parallelizes independent reads and avoids blocking event writes where possible

## Live App Rules

- installable web-app work must preserve the same auth/session model in standalone mode
- app-shell assets may be cached, but live telemetry, alerts, access requests, and history must stay network-first
- operational screens should recover automatically on focus, reconnect, or visibility change
- any service-worker or cache work must respect freshness indicators rather than masking stale data

## Core Alert Rules

This phase must support alert logic for:

- overweight (`weightWarningState = 1`)
- underweight (`weightWarningState = -1`)
- offline hardware / stale telemetry
- significant weight change during transit

The in-transit weight-change alert is the core theft/loss signal and should be treated as a high-priority incident workflow.

## Dashboard Structure Priorities

- top action queue for pending access requests and trains waiting on clearance decisions
- active incident section for high-severity unresolved alerts
- fleet health section for stale/offline hardware and current telemetry freshness
- transit watch section for trains in motion with weight status, speed, and latest location
- recent operations timeline for the latest alert, clearance, and request events

## Files To Create

- `features/alerts/components/AlertList.tsx`
- `features/alerts/components/AlertFilters.tsx`
- `features/alerts/components/AlertDetailPanel.tsx`
- `features/history/components/HistoryFilters.tsx`
- `features/history/components/HistoryTable.tsx`
- `features/history/components/EventTimeline.tsx`
- `features/access/components/AccessRequestInbox.tsx`
- `features/access/components/AccessRequestActions.tsx`
- `features/access/components/AccessWorkspace.tsx`
- `features/clearance/components/ClearanceActionPanel.tsx`
- `features/dashboard/components/OperationsBoard.tsx`
- `features/dashboard/components/ActionQueue.tsx`
- `hooks/useLiveRefresh.ts`
- `services/dashboard/read.ts`
- `services/alerts/read.ts`
- `services/alerts/write.ts`
- `services/alerts/rules.ts`
- `services/history/read.ts`
- `services/events/write.ts`
- `types/alert.ts`
- `types/event.ts`

## Files To Update

- `app/layout.tsx`
- `app/manifest.ts`
- `app/(app)/layout.tsx`
- `app/(app)/access/page.tsx`
- `app/(app)/alerts/page.tsx`
- `app/(app)/fleet/[trainId]/page.tsx`
- `app/(app)/dashboard/page.tsx`
- `lib/constants/routes.ts`
- `components/layout/AppSidebar.tsx`
- `components/layout/MobileBottomNav.tsx`

## Validation Checklist

- overweight and underweight alerts are created correctly
- stale/offline telemetry produces an offline alert
- in-transit weight change produces an incident alert
- master can review worker requests only for trains they manage
- clearance action records actor, method, and timestamp
- access workspace shows request, grant, revoke, and approval work by role
- dashboard shows action-first sections without requiring manual page refresh
- install metadata and standalone launch work correctly on supported mobile browsers
- independent server reads are parallelized where safe and do not regress correctness
- `npm run lint`, `npm run typecheck`, and `npm run build` pass

## Deliverables

- real alerts page
- request-inbox UI
- clearance action UI
- role-based access workspace
- event logging pipeline
- branded installable web-app foundation
- more useful dashboard structure for daily operators

## Hackathon Priority

Critical for demo.

## Implementation Status

Completed on 2026-04-05.

## Implementation Notes

- Added real alert persistence under `alerts` plus event logging under `events`.
- Wired telemetry ingest to open or resolve overweight, underweight, and in-transit weight-change alerts.
- Added freshness sync so stale or offline telemetry opens an offline alert when operational screens are loaded.
- Added real `/alerts` plus train-scoped alerts and recent event history on the train detail route.
- Added admin/master access-request review UI and a worker request form that can submit by train code.
- Added a dedicated `/access` workspace for email-based grant, request, approval, and revoke flows.
- Added remote and RFID-backed clearance actions with server-side Blynk clearance-LED sync.
- Reworked `/dashboard` around an operations-first board with action queue, incidents, fleet health, transit watch, and recent events.
- Later correction passes split `/dashboard` into tighter admin, master, and worker task surfaces so each role sees a narrower and more relevant operating screen.
- Later correction passes refactored `/access` into a layered workspace with role-specific lanes instead of stacking every request, grant, and activity surface on one page.
- Added CargoGuardian app identity, the supplied app icon, manifest metadata, and safe-area shell handling for standalone launches.
- Added targeted live refresh on dashboard, alerts, access, and train detail using query invalidation on interval, focus, reconnect, and visibility changes.
- Added a linked-device offline override so CargoGuardian can surface a train as offline immediately when Blynk reports that hardware disconnected, instead of waiting only for telemetry freshness thresholds.
- Later correction passes removed the standalone `/history` page and the unused `AppLogo` component after the access workspace fully replaced that sidebar slot.

## Deviations And Deferred Items

- No service worker was added in this phase. The install foundation is manifest-driven only so telemetry, alerts, and history remain network-first and do not risk stale cached operational data.
- Alert persistence uses one active alert document per train-and-rule pair. Repeated occurrences increment `occurrenceCount`, while the event log records the chronological alert trail.
- The in-transit weight-change incident threshold currently triggers at a minimum 750 kg delta and 5% of the previous weight. This is a safe default and may need calibration against real rail hardware noise.
- The standalone install surface now uses the supplied branded raster asset, while the old sidebar history slot has been repurposed into the access workspace operators use day to day.

## Validation Run

- `npm run lint`
- `npm run typecheck`
- `npm run build`
