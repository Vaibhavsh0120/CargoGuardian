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
- if free routing or geocoding is unavailable, the fallback is a direct polyline through source, waypoints, and destination

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
- the map must still function when only manually entered source/destination coordinates are available

## Validation Checklist

- a train route can be rendered from stored source/destination coordinates without paid services
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
