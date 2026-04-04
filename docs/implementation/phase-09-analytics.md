# Phase 9 - Analytics Integration

## Overview

Phase 9 integrates TigerGraph-backed analytics on top of real telemetry, alerts, and history.

Analytics should strengthen the cargo-security story, not replace the operational workflow.

## Objectives

- cache TigerGraph insights in Firestore
- expose analytics on the analytics page, dashboard, and train detail
- prioritize cargo-risk and route-risk insights

## Key Insight Areas

- route efficiency
- overload and underload trends
- repeated incident corridors
- unusual stop or delay patterns
- suspicious weight-change patterns across journeys

## Rules

- browser never calls TigerGraph directly
- stale cached results are preferable to broken screens
- analytics must integrate with the same alert and history model built in Phase 7

## Deliverables

- `/analytics`
- train-level analytics panels
- cached analytics reads
- manual refresh endpoint
