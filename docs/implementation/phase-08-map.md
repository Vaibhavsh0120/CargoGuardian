# Phase 8 - Map Integration

## Overview

Phase 8 adds live spatial awareness for trains already monitored through Phase 6 and Phase 7.

The map is a supporting operational view, not the landing page.

## Objectives

- render live train positions
- set up source and destination path data for each tracked journey
- render planned route geometry
- render the actual traveled path from telemetry history
- highlight incident locations quickly
- support drill-in from map to train detail

## Route Setup Plan

- use the existing `routes` collection to store route documents linked to a train or active journey
- each route document should capture `source`, `destination`, optional `waypoints`, and cached `plannedGeometry`
- source and destination should support human-readable names plus lat/lng so the map can render even without live geocoding
- route setup should be handled in server-side flows and cached in Firestore rather than computed on every client render
- if shaped routing is unavailable for an older route document, the fallback is the legacy direct polyline through source, waypoints, and destination until the route is resaved

## Map Rendering Plan

- use a free stack such as Leaflet or React Leaflet with OpenStreetMap tiles
- render planned route geometry as one overlay and actual GPS breadcrumbs as a separate overlay
- render the live train marker from `telemetry_current`
- render recent traveled segments from `telemetry_history`
- render incident markers from alerts/events using the latest known train location
- keep drill-in behavior tied to the real train detail route rather than a separate map-only data model

## Key Rules

- positions come from real telemetry data
- speed and motion shown on the map must come from derived telemetry, not fake marker animation
- incident markers should help responders identify the latest known location fast
- the map stack must remain free to use; do not require Mapbox billing or card details
- fallback state must exist if the chosen free map provider is unavailable
- planned route geometry and actual traveled path must remain visually and structurally distinct
- any route shaping or geocoding service must be called from server-side code, not the browser
- route selection should prefer actual railway stations rather than arbitrary free-text coordinates

## Validation Checklist

- a train route can be rendered from stored source/destination stations without paid services
- live train markers move only when real GPS updates arrive
- the actual breadcrumb path is built from real telemetry history rather than fake animation
- planned route and actual route are easy to distinguish in the UI
- incident markers link back to the correct train and latest known position

## Deliverables

- `/map`
- route setup flow for source, destination, and optional waypoints
- train markers
- source and destination markers
- planned route overlays
- actual breadcrumb overlays
- selected-train side panel
- incident-location emphasis

## Status

Completed on 2026-04-08.

## Implementation Notes

- Replaced the `/map` placeholder with a Leaflet + OpenStreetMap operations workspace.
- Added `app/api/map` to aggregate accessible trains, current telemetry, recent telemetry history, saved routes, and active alert locations into one server response.
- Added `app/api/trains/[trainId]/route` plus `services/routes/*` for server-side route persistence in Firestore.
- Added authenticated station search through `app/api/stations/search` using OpenStreetMap / Overpass railway-station data.
- Route documents now live in `routes/{trainId}` and store station-aware `source`, `destinationStop`, optional `waypoints`, cached `plannedGeometry`, and `geometrySource`.
- Planned routes render in blue, actual telemetry breadcrumbs render in amber, live train markers render from real `telemetry_current` GPS fixes, and active incidents render in red.
- The selected-train side panel supports drill-in to `/fleet/[trainId]`, summarizes current telemetry, and lets admins/masters search real stations and save shaped corridors.

## Deviations

- Public IRCTC developer APIs for live station lookup and route shaping were not integrated because a safe public developer surface was not identified. The current implementation uses server-side OpenStreetMap / Overpass station search plus rail-infrastructure shaping, then caches the resulting geometry in Firestore.
- Tile-provider outage handling is implemented as a coordinate-space fallback message and background rather than a second map provider.

## Deferred Follow-Up

- If higher-fidelity rail shaping is needed later, keep that computation server-side and cache the resulting geometry back into the existing route document.
- If fleet size grows materially, optimize the Phase 8 map aggregation path so recent telemetry breadcrumbs do not require one history read per visible train.
- If public Overpass usage becomes a bottleneck, move the shaping/search flow to a dedicated endpoint and keep the current server-side cache contract unchanged.

## Validation Run

- `npm run lint`
- `npm run typecheck`
- `npm run build`
