# Phase 8 - Map Integration

## Overview

Phase 8 adds live spatial awareness for trains already monitored through Phase 6 and Phase 7.

The map is a supporting operational view, not the landing page.

## Objectives

- render live train positions
- render route geometry
- highlight incident locations quickly
- support drill-in from map to train detail

## Key Rules

- positions come from real telemetry data
- speed and motion shown on the map must come from derived telemetry, not fake marker animation
- incident markers should help responders identify the latest known location fast
- the map stack must remain free to use; do not require Mapbox billing or card details
- fallback state must exist if the chosen free map provider is unavailable

## Deliverables

- `/map`
- train markers
- route overlays
- selected-train side panel
- incident-location emphasis
