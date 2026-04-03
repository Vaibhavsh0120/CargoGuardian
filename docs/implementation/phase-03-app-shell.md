# Phase 3 - App Shell and Navigation

## Phase Overview

Phase 1 introduced a minimal shell with placeholder navigation. This phase converts that foundation into the real CargoGuardian application shell used by all protected routes. The shell must reflect the dashboard-first Stitch design, support desktop and mobile layouts, and centralize route-aware navigation and selected-train context.

The result should be a stable, navigable application frame that later feature pages can plug into without duplicating layout logic.

## Objectives

- Finalize the protected desktop layout.
- Finalize the mobile bottom navigation.
- Add route-aware active navigation styling.
- Add a real page header and top status bar structure.
- Add selected train context and persistence.
- Add app-wide loading, empty, and error display conventions for the shell.

## Required Features

- Desktop sidebar navigation for:
  - Dashboard
  - Fleet
  - Map
  - Analytics
  - Alerts
  - History
  - Devices
  - Settings
- Mobile bottom navigation for:
  - Dashboard
  - Fleet
  - Map
  - Alerts
  - More/Settings
- Reusable top status bar with:
  - search placeholder or command surface
  - system status badges
  - session/operator area
- page container that standardizes spacing across routes
- route-level loading boundaries for core app pages
- selected train state holder for Dashboard and later detail pages

## Files To Create

- `components/layout/AppHeader.tsx`
- `components/layout/PageHeader.tsx`
- `components/layout/AppStatusIndicators.tsx`
- `components/layout/AppCommandBar.tsx`
- `components/layout/TrainContextProvider.tsx`
- `components/layout/TrainSelector.tsx`
- `components/states/LoadingPanel.tsx`
- `components/states/EmptyState.tsx`
- `components/states/ErrorState.tsx`
- `hooks/useTrainContext.ts`
- `types/train.ts`
- `lib/constants/routes.ts`
- `lib/constants/roles.ts`

## Files To Update

- `app/(app)/layout.tsx`
- `components/layout/AppSidebar.tsx`
- `components/layout/TopStatusBar.tsx`
- `components/layout/MobileBottomNav.tsx`
- `app/(app)/dashboard/page.tsx`
- placeholder route pages under `app/(app)/`

## Components To Build

- `AppHeader`
- `PageHeader`
- `AppStatusIndicators`
- `TrainContextProvider`
- `TrainSelector`
- `LoadingPanel`
- `EmptyState`
- `ErrorState`

These components should become the canonical shell pieces reused across later feature pages.

## APIs To Implement

- `GET /api/trains`
  - minimal list of trains for the selector and shell context
- optional `GET /api/system/status`
  - current integration/health summary for the top bar

## Services To Implement

- Train selector service
  - read minimal train list with ID, code, status, and display label
- Train context persistence helper
  - store current selected train in local storage or a safe client state persistence layer
- System status helper
  - return foundation-level health values for shell indicators

## Data Flow

1. Protected layout loads after auth validation.
2. Layout mounts train context provider.
3. Train selector fetches minimal train list from `/api/trains`.
4. User-selected train ID is stored in client state and persisted.
5. Dashboard and later train-scoped pages subscribe to this context when appropriate.
6. Navigation remains layout-owned; feature pages only render their content.

## UI Pages Affected

- `/dashboard`
- `/fleet`
- `/map`
- `/analytics`
- `/alerts`
- `/history`
- `/devices`
- `/settings`

## Integration Points

- Auth session state from Phase 2
- Firestore `trains` collection
- future dashboard and fleet queries

## Dependencies

- Depends on Phase 2.
- Must be completed before Phase 4 so fleet and train pages render inside the correct shell.

## Validation Checklist

- Authenticated users see the protected shell.
- Active sidebar item highlights correctly.
- Mobile bottom navigation highlights correctly.
- Train selector loads list data and persists the last selection.
- Loading and empty-state components render without layout shift.
- Placeholder pages remain accessible through the real shell.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deliverables

- Production shell layout
- Real navigation structure
- Train context provider
- Standardized page header and status bar
- Shared loading/empty/error state components

## Hackathon Priority

**Critical for demo**

Even though Phase 1 introduced placeholders, this phase is required to make the app feel like a cohesive product rather than a collection of routes.
