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
- Role-aware access for `worker`, `train master`, and `admin`
- Assignment records so the same train can be shared across accounts with different privileges
- Admin-only onboarding endpoint that issues invite-only URLs for admin accounts
- Admin and train master panels for granting/removing train access plus worker requests

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
- `GET /api/trains/assignments`
  - list assignment records scoped to the authenticated user/role
- `POST /api/trains/access`
  - grant a train to a user (admin/master)
- `POST /api/trains/access/request`
  - worker/master can request access by email; notifications stored and actionable by admin/master
- `DELETE /api/trains/access`
  - revoke a train assignment

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
- Firestore `trainAssignments` for storing access metadata
- `users` profiles must track role (worker/master/admin) so routes can enforce scope

## Dependencies

- Depends on Phase 2 and Phase 3.
- Must complete before Phase 5, because device pairing requires real train records.
- API and UI must enforce that `admin` sees every train, assigned `train masters` see their trains at any time, and `workers` only get pre-departure clearance metadata for trains they are allowed to inspect.
- Signup flow creates worker/master accounts via a role selector, while admins are added through a private invite URL (not linked from the main site).

## Access Workflow

- Admins recover the fleet on `/admin/access`, grant/revoke training access for any user by email, and approve request tickets from masters/workers.
- Masters pass train access to workers via `/master/access`, but only for trains they already own; their page also surfaces worker requests.
- Workers (and masters for additional workers) raise `/access/request` tickets that carry an email and reason; the owning admin/master can accept or reject them.
- Successful grants create `trainAssignments` documents (`trainId`, `userId`, `role`, `grantedBy`, `grantedAt`, `expiresAt?`); revocations cascade to telemetry/alerts access.

## Validation Checklist

- Fleet page loads real trains.
- Search and status filters work correctly.
- Add Train creates a valid Firestore document.
- New train appears in fleet list and selector.
- Train detail loads the selected train.
- Dashboard summary reflects actual train counts.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- Role enforcement is validated: admin can list everything, train master views only assigned trains anytime, worker views only clearance-stage trains they are mapped to before departure.
- Document the lifecycle for admin/master giving/removing train access by email so future device/assignment phases can implement the workflows.

## Deliverables

- Real fleet page
- Real train detail page
- Real add train workflow
- Firestore-backed train APIs and services
- Dashboard train summary based on live data

## Hackathon Priority

**Critical for demo**

The demo narrative depends on choosing a train and opening its operational view. This phase creates that core path.

## Implementation Notes

This phase introduced several robust additions to data fetching and authentication flow:

1. **Role Adjustments**: We migrated the `viewer`/`operator` role nomenclature to `worker`/`master` to reflect the operational reality. We also ensured the database reads and endpoints universally default correctly and reject unauthenticated flows.
2. **Onboarding**: A custom intermediate endpoint (`/onboarding`) was built for users signing in via Google so they could properly establish their Role before interacting with the system, closing a gap in the auth provider abstraction.
3. **Admin Onboarding**: Instead of building out an entire independent dashboard for onboarding admins, we secured the `admin` creation path through a query param check comparing `searchParams.code` to `process.env.ADMIN_INVITE_SECRET`.
4. **Access and Assignments Model**: Under the hood, Train read checks are fully scope-aware today. An admin will view everything, a user with ownership views their train, and the `trainAssignments` collection determines shared read/write scope. Future UI tasks can now freely consume `/api/trains/assignments` and `/api/trains/access`.
5. **Route Progress Component**: `RouteProgressCard.tsx` stub was implemented and included in the frontend page layout.

### Post-Phase Audit Fixes

After the initial implementation, the following issues were identified and resolved:

1. **Security: Train summary endpoint bypassed access check** — `app/api/trains/[trainId]/summary/route.ts` was calling `getTrain(trainId)` without passing the authenticated user, allowing any authenticated user to fetch any train's summary. Fixed by passing `user` to `getTrain()`.
2. **Security: `getTrainSummary()` was not user-scoped** — Workers and masters received fleet-wide counts instead of scoped counts. Fixed by adding an optional `user?: AppUser` parameter to `getTrainSummary()` and applying the same assignment-based filtering used in `listTrains()`.
3. **Security: Dashboard summary endpoint bypassed user scoping** — `app/api/dashboard/summary/route.ts` and `services/dashboard/summary.ts` were calling `getTrainSummary()` without passing the user. Fixed by threading the user through both layers.
4. **Missing endpoint: `POST /api/trains/access/request`** — Created `app/api/trains/access/request/route.ts` to allow workers and masters to request access to trains. Stores requests in a new `accessRequests` collection with pending status, deduplication, and role-aware submission.
5. **Type mismatch: `grantedAt` Timestamp normalization** — `app/api/trains/assignments/route.ts` was passing Firestore `Timestamp` objects directly to the client without converting to ISO strings. Added a `normalizeTimestamp()` helper to handle `string`, `Date`, and Firestore `Timestamp` values.
6. **Code quality: Dead comment block in assignments endpoint** — Removed the large commented-out reasoning block and standardized the response to use the `ok()` helper instead of `NextResponse.json()`.
7. **Code quality: Non-null assertions in access endpoint** — Replaced `trainDoc.data()!` with explicit null checks and safe error responses.
8. **Code quality: Mixed response patterns** — Standardized `app/api/trains/access/route.ts` and `app/api/trains/assignments/route.ts` to use the `ok()` helper from `@/lib/api/response` for consistency.
9. **Type alignment: `CreateTrainInput` vs `CreateTrainPayload`** — Made `CreateTrainInput` in `types/train.ts` non-optional for all fields to match the Zod-validated `CreateTrainPayload` shape, eliminating a potential drift gap.
10. **Server/client boundary: `RouteProgressCard.tsx`** — Added `"use client"` directive since the component is rendered inside a client component tree.
