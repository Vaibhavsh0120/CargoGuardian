# Phase 8 - Map Integration

## Phase Overview

This phase adds spatial awareness to CargoGuardian. The application is dashboard-first, not map-first, so the map is a supporting operational view rather than the landing experience. The map page should render train positions, route geometry, and contextual overlays while staying resilient when Mapbox or location data is degraded.

## Objectives

- Implement the Map page.
- Render planned route geometry and current train positions.
- Add fleet overlay and train selection interactions.
- Keep the map optional but operationally useful.
- Add fallback UI if the map service fails.

## Required Features

- Mapbox base map
- route overlay per train/route
- live train markers
- selected train side panel or floating detail card
- fleet overlay list
- map filters for train status or region
- marker click -> train detail navigation
- fallback panel if Mapbox is unavailable

## Files To Create

- `features/map/components/MapCanvas.tsx`
- `features/map/components/MapPanel.tsx`
- `features/map/components/MapFleetOverlay.tsx`
- `features/map/components/TrainMapMarker.tsx`
- `features/map/components/RouteLegend.tsx`
- `features/map/components/MapFallbackState.tsx`
- `features/map/hooks/useMapTrains.ts`
- `features/map/hooks/useRouteGeometry.ts`
- `features/map/services/map-client.ts`
- `services/mapbox/client.ts`
- `services/mapbox/routes.ts`
- `services/mapbox/geocoding.ts`
- `types/route.ts` updates for geometry payloads

## Files To Update

- `app/(app)/map/page.tsx`
- `types/train.ts`
- `app/(app)/fleet/[trainId]/page.tsx` if it links into map context

## Components To Build

- `MapCanvas`
- `MapPanel`
- `MapFleetOverlay`
- `TrainMapMarker`
- `RouteLegend`
- `MapFallbackState`

## APIs To Implement

- `GET /api/map/routes`
- `GET /api/map/trains`

Possible payload split:
- route geometry endpoint
- active train positions endpoint

## Services To Implement

- Mapbox route geometry service
- Train position summary service
- route metadata merger for map overlay payloads

## Data Flow

1. Map page loads current train positions through `/api/map/trains`.
2. Page loads route geometry through `/api/map/routes`.
3. Client map component renders markers and selected route overlay.
4. Selected marker updates overlay state and can navigate into `/fleet/[trainId]`.
5. If map bootstrap fails, fallback state presents train list and route summary.

## UI Pages Affected

- `/map`
- optional links from `/dashboard`
- optional links from `/fleet/[trainId]`

## Integration Points

- Firestore `trains`
- Firestore `telemetry_current`
- Firestore `routes`
- Mapbox public token and server-side route helpers

## Dependencies

- Depends on Phase 4 for trains/routes.
- Depends on Phase 6 for current positions.
- Can be deferred if demo time is constrained.

## Validation Checklist

- Map page loads without blocking the rest of the shell.
- Route geometry displays for selected trains.
- Train markers display current locations.
- Selecting a marker updates context and overlay details.
- Clicking marker or panel can navigate to train detail.
- Fallback state renders if map fails or token is missing.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deliverables

- Real Map page
- Route and position APIs
- Map overlay components
- Safe degraded-mode fallback for map outages

## Hackathon Priority

**Optional but valuable**

The map adds demo value but is not mandatory if the rest of the operational path is already working.
