# Phase 1 - Project Initialization

## Overview

Phase 1 established the CargoGuardian foundation and is complete.

This phase created the runnable Next.js base that all later phases build on.

## Delivered

- Next.js App Router foundation
- TypeScript project setup
- Tailwind CSS setup and shared theme wiring
- base app layouts and route groups
- shared providers for query, theme, and toasts
- Firebase client and admin bootstrap layers
- environment-variable scaffolding
- initial placeholder routes required for the planned product structure

## Locked Rules From This Phase

- The app must stay runnable after every later phase.
- Shared providers belong in reusable app-level infrastructure, not feature pages.
- Firebase integration must be split into browser-safe and server-only layers.
- Environment requirements must be documented alongside the implementation.

## Implementation Notes

Post-phase correction work kept this phase aligned with the real product path:

1. The repo now targets Next.js 15, React 19, and strict TypeScript.
2. Shared provider setup lives under `components/providers/`.
3. Firebase bootstrap is separated into `services/firebase/client.ts` and `services/firebase/admin.ts`.
4. The root architecture now assumes the protected app shell and auth route groups used by later phases.

## Deferred

- Real authentication and protected routing were completed in Phase 2.
- Real fleet, telemetry, and integration workflows were completed in later phases.
