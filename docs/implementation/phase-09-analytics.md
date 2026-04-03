# Phase 9 - Analytics Integration

## Phase Overview

This phase integrates TigerGraph-driven intelligence into CargoGuardian. The analytics layer should not block the core dashboard flow, so the implementation must rely on server-side queries and Firestore-cached results rather than direct live client calls.

The result should be a convincing analytics page plus train-level insight panels showing overload risk, reroute suspicion, bottlenecks, and route efficiency.

## Objectives

- Implement analytics page.
- Add TigerGraph service adapter.
- Cache analytics insight results in Firestore.
- Surface analytics on dashboard and train detail.
- Integrate analytics-driven alerts where appropriate.

## Required Features

- Analytics overview page
- train-scoped analytics detail view
- cached insight reads from Firestore
- manual analytics refresh endpoint
- freshness and stale-cache indicators
- risk cards for:
  - bottleneck detection
  - overload risk
  - reroute anomaly
  - route efficiency

## Files To Create

- `features/analytics/components/AnalyticsOverview.tsx`
- `features/analytics/components/AnalyticsCard.tsx`
- `features/analytics/components/BottleneckPanel.tsx`
- `features/analytics/components/RiskScoreCard.tsx`
- `features/analytics/components/InsightList.tsx`
- `features/analytics/components/AnalyticsFreshnessBadge.tsx`
- `features/analytics/hooks/useAnalytics.ts`
- `features/analytics/hooks/useTrainAnalytics.ts`
- `features/analytics/hooks/useRefreshAnalytics.ts`
- `features/analytics/services/analytics-client.ts`
- `services/tigergraph/client.ts`
- `services/tigergraph/queries.ts`
- `services/tigergraph/insights.ts`
- `services/analytics/read.ts`
- `services/analytics/cache.ts`
- `services/analytics/refresh.ts`
- `lib/validation/analytics.ts`
- `types/analytics.ts`

## Files To Update

- `app/(app)/analytics/page.tsx`
- `app/(app)/dashboard/page.tsx`
- `app/(app)/fleet/[trainId]/page.tsx`
- `services/alerts/lifecycle.ts` if analytics insights generate alerts

## Components To Build

- `AnalyticsOverview`
- `AnalyticsCard`
- `BottleneckPanel`
- `RiskScoreCard`
- `InsightList`
- `AnalyticsFreshnessBadge`
- dashboard `AnalyticsSummaryRail`
- train-detail `TrainAnalyticsPanel`

## APIs To Implement

- `GET /api/analytics`
- `GET /api/analytics/[trainId]`
- `POST /api/analytics/refresh`

## Services To Implement

- TigerGraph client
- analytics query orchestration service
- Firestore cache read/write service
- stale-cache fallback service
- optional analytics-to-alert bridge

## Data Flow

1. Refresh job or manual trigger asks TigerGraph for insights.
2. Service normalizes output and writes `analyticsInsights` documents.
3. Dashboard and Analytics page read from cached Firestore-backed APIs.
4. If insights are expired, API returns stale data with freshness markers while recompute occurs.
5. Train detail reads train-filtered analytics subset.
6. High-severity analytics outcomes may generate alerts in the shared alert system.

## UI Pages Affected

- `/analytics`
- `/dashboard`
- `/fleet/[trainId]`
- `/alerts` if analytics insights create actionable alerts

## Integration Points

- TigerGraph
- Firestore `analyticsInsights`
- Firestore `trains.analyticsSummary`
- telemetry and history from Phase 6
- alerts from Phase 7

## Dependencies

- Depends on Phases 6 and 7.
- Critical for minimum convincing hackathon demo.

## Validation Checklist

- Analytics page loads cached insights.
- Train-level analytics loads for selected train.
- Refresh endpoint updates cache and timestamps.
- Expired insight state is displayed clearly.
- Dashboard analytics summary reflects cached data.
- Analytics-driven alerts integrate into the alert model if implemented in this phase.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Deliverables

- Real analytics page
- TigerGraph integration layer
- Firestore analytics cache
- Dashboard and train analytics panels
- analytics refresh path

## Hackathon Priority

**Critical for demo**

Analytics is one of the core differentiators listed in the product brief and must be visible during the demo.
