# Phase 4 - Fleet and Train Management

## Phase Overview

This phase introduces the first real business workflow: browsing trains, creating trains, and drilling into an individual train. It establishes the train as the central entity across the application and replaces placeholder dashboard/fleet content with real Firestore-backed data.

The result should be that an operator can view the fleet, create a train asset, select a train, and open a structured train detail page that later phases will enrich with telemetry, alerts, devices, and analytics.

## Objectives

- Implement the Fleet list page.
- Implement the Train Detail page.
- Implement Add Train flow.
- Connect all three to Firestore.
- Prepare route and cargo metadata fields according to the planned schema.

## Required Features

- Fleet list with search/filter/sort
- Add Train form
- Train detail header with core operational metadata
- Dashboard summary cards based on real train records
- Train selector using live Firestore-backed data
- Route references stored on trains
- Train status and freshness summaries

## Files To Create

- `app/(app)/fleet/loading.tsx`
- `app/(app)/fleet/[trainId]/page.tsx`
- `app/(app)/fleet/[trainId]/loading.tsx`
- `app/(app)/trains/new/page.tsx`
- `features/fleet/components/FleetFilters.tsx`
- `features/fleet/components/FleetTable.tsx`
- `features/fleet/components/FleetEmptyState.tsx`
- `features/fleet/hooks/useFleet.ts`
- `features/fleet/services/fleet-client.ts`
- `features/train-detail/components/TrainDetailHeader.tsx`
- `features/train-detail/components/RouteProgressCard.tsx`
- `features/train-detail/components/TrainOverviewGrid.tsx`
- `features/train-detail/hooks/useTrain.ts`
- `features/train-detail/services/train-client.ts`
- `features/trains/components/AddTrainForm.tsx`
- `features/trains/hooks/useCreateTrain.ts`
- `features/trains/services/train-write-client.ts`
- `services/trains/read.ts`
- `services/trains/write.ts`
- `services/dashboard/summary.ts`
- `lib/validation/trains.ts`
- `types/train.ts`
- `types/route.ts`

## Files To Update

- `app/(app)/dashboard/page.tsx`
- `app/(app)/fleet/page.tsx`
- `components/layout/TrainSelector.tsx` or its eventual location
- `lib/constants/nav.ts` if route labels need refinement

## Components To Build

- `FleetTable`
- `FleetFilters`
- `FleetEmptyState`
- `TrainDetailHeader`
- `RouteProgressCard`
- `TrainOverviewGrid`
- `AddTrainForm`
- supporting status badges for train state and freshness

## APIs To Implement

- `GET /api/trains`
  - list trains with filters
- `POST /api/trains`
  - create train document
- `GET /api/trains/[trainId]`
  - full train document and immediate summary
- `GET /api/trains/[trainId]/summary`
  - focused train summary for drill-down and later widget use

## Services To Implement

- Train read service
  - list, single-train fetch, summary fetch
- Train write service
  - create train with schema validation
- Dashboard summary service
  - compute total, active, delayed, offline counts from `trains`

## Data Flow

1. Fleet page queries `/api/trains` with filters.
2. API route validates parameters and calls train read service.
3. Firestore returns train list documents optimized for fleet view.
4. Selecting a train navigates to `/fleet/[trainId]`.
5. Train detail fetches `/api/trains/[trainId]`.
6. Add Train form posts to `/api/trains`.
7. On success, UI redirects to the new train detail or pairing next-step.

## UI Pages Affected

- `/dashboard`
- `/fleet`
- `/fleet/[trainId]`
- `/trains/new`

## Integration Points

- Firestore `trains`
- Firestore `routes`
- shell train selector from Phase 3

## Dependencies

- Depends on Phase 2 and Phase 3.
- Must complete before Phase 5, because device pairing requires real train records.

## Validation Checklist

- Fleet page loads real trains.
- Search and status filters work correctly.
- Add Train creates a valid Firestore document.
- New train appears in fleet list and selector.
- Train detail loads the selected train.
- Dashboard summary reflects actual train counts.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deliverables

- Real fleet page
- Real train detail page
- Real add train workflow
- Firestore-backed train APIs and services
- Dashboard train summary based on live data

## Hackathon Priority

**Critical for demo**

The demo narrative depends on choosing a train and opening its operational view. This phase creates that core path.
