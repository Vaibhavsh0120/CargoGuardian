# Phase 9 - Analytics Integration

## Overview

Phase 9 integrates TigerGraph-backed analytics on top of real telemetry, alerts, and history.

Analytics should strengthen the cargo-security story, not replace the operational workflow.

## Objectives

- define the TigerGraph ingestion model from Firestore operational data
- cache TigerGraph insights in Firestore
- expose analytics on the analytics page, dashboard, and train detail
- prioritize cargo-risk, route-risk, and corridor-risk insights

## Planned TigerGraph Role

- Firestore remains the operational source of truth for trains, telemetry, alerts, and events
- server-side jobs or privileged routes should normalize journey, route, alert, and incident facts into TigerGraph
- TigerGraph should answer graph-shaped questions such as repeated risky corridors, shared incident paths, and recurring suspicious journey patterns
- the browser should read cached insight documents from Firestore, not query TigerGraph directly
- cached results should include freshness metadata and query-version metadata so the UI can explain how current an insight is

## Initial Graph Model

Planned first-pass vertices:

- `Train`
- `Journey`
- `Route`
- `Corridor`
- `Station`
- `Incident`

Planned first-pass edges:

- `TRAIN_RAN_JOURNEY`
- `JOURNEY_USED_ROUTE`
- `ROUTE_HAS_CORRIDOR`
- `JOURNEY_STARTED_AT`
- `JOURNEY_ENDED_AT`
- `JOURNEY_TRIGGERED_INCIDENT`
- `INCIDENT_OCCURRED_ON_CORRIDOR`

## Key Insight Areas

- route efficiency
- overload and underload trends
- repeated incident corridors
- unusual stop or delay patterns
- suspicious weight-change patterns across journeys
- train risk scoring across recent journeys
- corridor hot spots shared by multiple trains

## Rules

- browser never calls TigerGraph directly
- stale cached results are preferable to broken screens
- analytics must integrate with the same alert and history model built in Phase 7
- do not stream every raw telemetry point into TigerGraph; prefer journey summaries, route metadata, alert events, and aggregates
- high-severity incidents should be able to trigger targeted analytics refresh without waiting for a full batch rebuild

## Cache And Refresh Plan

- write query outputs into `analyticsInsights`
- cache by scope such as `global`, `train`, `route`, and `corridor`
- refresh on a schedule for broad insights and on demand for train-scoped or incident-scoped views
- expose a privileged manual refresh endpoint with rate limiting

## Validation Checklist

- analytics pages render from Firestore-cached insight documents even if TigerGraph is unavailable
- train detail can show a scoped risk summary without client access to TigerGraph
- dashboard can surface top risky trains or corridors from cached data
- each rendered insight exposes a freshness timestamp or stale state

## Deliverables

- `/analytics`
- train-level analytics panels
- route-level and corridor-level analytics panels
- server-side TigerGraph sync/query layer
- cached analytics reads
- privileged manual refresh endpoint
