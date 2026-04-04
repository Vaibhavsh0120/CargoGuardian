# CargoGuardian Agent Operating Manual

This file is the primary operating manual for any future AI agent or developer working in this repository.

It exists to prevent the project from drifting away from the planned architecture, phase order, data model, or demo strategy.

If you are the next agent, read this file before making any code changes.

## 1. Mission

Build **CargoGuardian**, a dashboard-first rail cargo monitoring platform for trains equipped with ESP32 sensor devices.

The product must support:

- Login and signup
- Dashboard-first authenticated experience
- Fleet browsing and train drill-down
- Device inventory and pairing by device code
- Live telemetry and device status
- Alerts and anomaly visibility
- Historical telemetry and event history
- Map view
- TigerGraph analytics
- Settings and operator profile management

The system must deploy cleanly on Vercel and keep secrets out of the client.

## 2. Current State

At the time this file was last updated:

- **Phases 1, 2, 3, and 4 are complete**
- The repository already contains:
  - Next.js 15 App Router foundation
  - TypeScript configuration
  - Tailwind theme setup
  - base UI primitives in `components/ui/`
  - root providers
  - functional auth pages
  - auth APIs and protected route guards
  - Firebase Admin session cookies for authenticated routes
  - server-side Firestore user profile creation and hydration for authenticated users
  - production app shell with desktop/mobile navigation
  - train selector context with persistence and shell data APIs
  - standardized shell loading and error states
  - Firebase client/admin initialization
  - local commit-safety protections for env files, service-account JSON files, and common key material
  - health endpoint
  - phase planning documents under `docs/implementation/`
  - fleet list with search, status filter, and sort
  - train detail page with overview and route progress
  - add train workflow with Firestore-backed creation
  - role-scoped train access (admin sees all, masters see assigned, workers see clearance-scoped)
  - train access grant, revoke, and request endpoints
  - dashboard summary based on live, role-scoped train counts
  - demo mode fallback behind `NEXT_PUBLIC_DEMO_MODE`

What is **not** yet implemented:

- Real device, telemetry, alert, map, analytics, or history features
- Blynk integration
- TigerGraph integration
- Real route-aware dashboard functionality beyond train counts

## 3. Read Order Before Any Work

Before editing code, read these files in order:

1. `AGENTS.md`
2. `docs/implementation/PHASE_INDEX.md`
3. `docs/implementation/HOW_TO_CONTINUE.md`
4. The markdown file for the next incomplete phase
5. `docs/implementation/GLOBAL_TODO.md`
6. Relevant existing code in:
   - `app/`
   - `components/`
   - `features/`
   - `services/`
   - `lib/`
   - `types/`

Do not start coding before doing that read pass.

## 4. Non-Negotiable Build Rules

- Build the project **phase-by-phase**.
- Keep the application runnable after every phase.
- Do not skip phases unless the user explicitly overrides the plan.
- Do not implement multiple major future phases “while you are there”.
- Do not create disconnected static UI that will be thrown away later.
- Do not expose secrets to the client.
- Do not access Blynk, TigerGraph, or privileged Firebase operations directly from browser code.
- Do not insert fake production data into real flows.
- If demo data is required, isolate it behind `NEXT_PUBLIC_DEMO_MODE`.
- Do not rewrite architecture casually. If architecture must change, update the docs in the same turn.

## 5. Product Direction

CargoGuardian is:

- **dashboard-first**
- **operations-focused**
- **rail logistics monitoring**
- **sensor-driven**
- **integration-backed**

CargoGuardian is **not**:

- map-first
- a generic admin panel
- a static design exercise
- a collection of unrelated screens

The dashboard must remain the default landing page after login.

## 6. Design Direction

The visual system is based on the Stitch export and the “Kinetic Precision” design language.

Key visual rules:

- industrial navy primary tone
- amber/orange accent for warning focus
- editorial typography with `Manrope` for display and `Inter` for body
- tonal layering instead of thin divider-heavy layouts
- glass and blur only where it adds structure, not as decoration everywhere
- calm, high-trust dashboard composition
- desktop shell with sidebar + top bar
- mobile shell with bottom navigation

When implementing UI:

- reuse shared components
- avoid page-specific ad hoc styling where a shared component should exist
- keep the dashboard shell consistent across pages

## 7. Architecture Snapshot

### Frontend stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui-style component system
- TanStack Query
- Recharts
- Mapbox GL

### Backend/integration stack

- Next.js Route Handlers
- Firebase Auth
- Firebase Firestore
- Blynk
- TigerGraph

### Deployment target

- Vercel

## 8. Required Layering

Keep code in these layers:

- `app/`
  - routes, layouts, route handlers, route-level loading/error boundaries
- `components/ui/`
  - low-level shared UI primitives
- `components/`
  - shared domain-aware presentation components
- `features/`
  - business-domain modules
- `hooks/`
  - reusable cross-feature hooks
- `services/`
  - domain services and external adapters
- `lib/`
  - validation, env, auth, logging, query helpers, constants, general utilities
- `types/`
  - shared domain and API types

Rules:

- UI components should not embed third-party secrets or privileged logic.
- Route handlers should orchestrate services, not become giant business-logic files.
- Feature pages should mostly compose components and hooks, not contain all logic inline.
- Reusable logic belongs in hooks/services/lib, not page files.

## 9. Routing Model

Planned route structure:

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/fleet`
- `/fleet/[trainId]`
- `/trains/new`
- `/devices`
- `/devices/pair`
- `/devices/[deviceId]`
- `/map`
- `/analytics`
- `/alerts`
- `/history`
- `/settings`

Protected route group:

- everything under `app/(app)`

Public route group:

- everything under `app/(auth)`

## 10. Core Domain Model

Main entities:

- User / Operator
- Train
- Device
- Device Assignment
- Telemetry Snapshot
- Telemetry History Record
- Alert
- Analytics Insight
- Route
- Event
- Audit Log

Relationship summary:

- Train has telemetry, alerts, history, analytics, and device assignments
- Device may be assigned to a train
- Device generates telemetry
- Telemetry feeds alerts and analytics
- Analytics can create or enrich alerts
- Events capture operational history
- Audit logs capture sensitive user actions

## 11. Firestore Collections

Current planned collections:

- `users`
- `trains`
- `devices`
- `deviceAssignments`
- `telemetry_current`
- `telemetry_history`
- `telemetry_aggregates`
- `alerts`
- `analyticsInsights`
- `routes`
- `events`
- `auditLogs`
- `systemStatus`
- `dashboardSnapshots`

Do not invent a conflicting Firestore structure unless absolutely necessary. If the schema must evolve, update the planning docs in the same change.

## 12. Data and Integration Rules

### Firebase

- Auth is authoritative for identity.
- Firestore is the app's operational system of record.
- Use Firebase Admin on the server for privileged operations.
- Session persistence is currently implemented with Firebase Admin session cookies, not a client-only token bridge.
- User profile creation currently happens server-side during signup and session restoration flows.

### Blynk

- Blynk is the source for device telemetry/device status.
- Blynk secrets stay server-side.
- All ingestion and validation must route through Next.js APIs/services.

### TigerGraph

- TigerGraph is the analytics engine.
- Browser never calls TigerGraph directly.
- Cache results in Firestore for fast reads and resilience.

### Mapbox

- Prefer server-assisted map data shaping.
- If a public token is used in-browser, it must be restricted and non-privileged.

## 13. Real-Time Rules

- Current telemetry reads should come from `telemetry_current`.
- Historical telemetry should come from `telemetry_history` or aggregates.
- Live UI should prefer SSE or controlled polling.
- Always show freshness or “last updated” indicators.
- Always provide degraded states for stale or disconnected telemetry.

## 14. Hackathon Demo Rules

The minimum demo path is:

1. Login
2. Dashboard
3. Select Train
4. View Live Telemetry
5. See Alerts
6. Open Analytics
7. Pair Device

If hardware or integrations are unstable:

- use `NEXT_PUBLIC_DEMO_MODE`
- keep fallback data path isolated from production flows
- document the fallback in docs
- do not silently mix demo data into real integration code

## 15. Phase Execution Protocol

When working on a phase:

1. Confirm which phase is next in `PHASE_INDEX.md`.
2. Read the phase file fully.
3. Inspect the files it says to create or update.
4. Implement only that phase.
5. Validate the phase.
6. Update the planning docs before stopping.

Unless the user explicitly instructs otherwise:

- implement **one phase only**
- stop after finishing that phase
- do not start the next phase automatically

## 16. Finalized Screen Rules

Some user-facing screens become effectively final before the entire product is complete. When a screen is marked finalized, future work must preserve its end-user tone and must not reintroduce internal implementation language.

Rules:

- Do not show users labels such as `Phase 1`, `Phase 2`, `TODO`, `placeholder`, `planned`, or implementation-status copy on finalized screens.
- Do not add engineering notes, internal sequencing, or architecture commentary into user-facing copy.
- If a finalized screen needs new functionality later, extend it without regressing its tone back into developer-facing language.
- When a new screen becomes stable and user-ready, add it to the finalized screen list in this file.

Current finalized user-facing screens:

- `/login`
- `/signup`
- `/forgot-password`

## 17. Required Documentation Updates After Every Completed Phase

Every time a phase is completed, you must update:

- `docs/implementation/PHASE_INDEX.md`
  - mark the phase completed
  - optionally mark the next phase as current
- the phase file itself
  - add implementation notes
  - record deviations from the plan
  - list any leftover items deferred to later phases
- `docs/implementation/GLOBAL_TODO.md`
  - add newly discovered follow-up items
  - remove items fully completed
- `README.md`
  - update the “Current Status” section if the public state of the repo changed materially
- `docs/README.md`
  - if new docs were added

If the phase changed environment variables, APIs, setup requirements, or route structure, also update:

- `.env.example`
- setup docs in `docs/`

## 18. Phase Completion Checklist

A phase is not complete until all of these are true:

- all planned routes for the phase exist and render
- required services exist in the planned layer
- required APIs exist
- key UI components are reusable and placed correctly
- validation checklist from the phase file was executed
- `npm run lint` passes
- `npm run typecheck` passes
- `npm run build` passes

If one of those fails, the phase is not done.

## 19. How To Record Deviations

If implementation differs from the phase plan:

- do not ignore it
- add a short “Implementation Notes” section to that phase document
- explain:
  - what changed
  - why it changed
  - what future phases must now assume

If the change affects multiple future phases, also update:

- `PHASE_INDEX.md`
- `GLOBAL_TODO.md`
- this `AGENTS.md` file if the change is fundamental

## 20. Validation Expectations

For every phase, at minimum run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

Also run the manual validation checklist from the phase file.

If integration logic was added, also verify:

- environment variables are documented
- fallback behavior exists for unavailable services
- errors are surfaced cleanly in UI

## 21. Code Quality Rules

- Prefer small modular files.
- Keep TypeScript strict.
- Validate API inputs with Zod.
- Keep server-only code off the client.
- Avoid giant page files.
- Reuse shared components.
- Add meaningful loading and error states.
- Keep the app deployable at every step.

## 22. Files To Watch Carefully

These files are important coordination points and must stay consistent:

- `AGENTS.md`
- `README.md`
- `docs/implementation/PHASE_INDEX.md`
- `docs/implementation/GLOBAL_TODO.md`
- `docs/implementation/HOW_TO_CONTINUE.md`
- current active phase markdown
- `.env.example`
- `tailwind.config.ts`
- `app/layout.tsx`
- `app/(app)/layout.tsx`
- `services/firebase/client.ts`
- `services/firebase/admin.ts`
- `.gitignore`
- `.githooks/pre-commit`

## 23. If You Are The Next AI Agent

Do this:

1. Read this file fully.
2. Read the phase index.
3. Open the next incomplete phase file.
4. Inspect the current implementation.
5. Work only on that phase.
6. Keep the application green.
7. Update the planning docs when done.
8. Stop.

Do not do this:

- skip phases
- add unrelated features
- overwrite the architecture without documentation
- silently change data models
- leave the docs stale after code changes
- commit or stage secrets, env files, private keys, or service-account JSON files

## 24. Current Next Step

At the time of writing, the next expected implementation step is:

- `docs/implementation/phase-04-fleet-management.md`
