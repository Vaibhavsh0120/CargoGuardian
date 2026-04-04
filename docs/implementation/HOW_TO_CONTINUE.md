# How To Continue CargoGuardian

This repository must continue phase-by-phase. Do not improvise around the plan without updating the docs.

## Read First

Read these files in order:

1. [../../AGENTS.md](../../AGENTS.md)
2. [PHASE_INDEX.md](./PHASE_INDEX.md)
3. [GLOBAL_TODO.md](./GLOBAL_TODO.md)
4. the next incomplete phase file

Then inspect the relevant code before making assumptions.

## Mandatory Workflow

1. Confirm the next incomplete phase.
2. Read the full phase file.
3. Inspect the existing implementation it depends on.
4. Implement only that phase unless the user explicitly asks for a correction pass.
5. Run:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
6. Update phase docs before stopping.

## Hard Rules

- Do not skip phases.
- Do not reintroduce a separate device inventory.
- Do not add fake UI data.
- Do not expose server secrets to the browser.
- Do not branch the UI into "real mode" vs "demo mode".
- Do not leave docs stale after changing architecture or data shape.

## Locked Product Assumptions

The real product model is:

- one train = one hardware unit
- admin creates the Blynk device manually from the template
- Add Train links that device using the per-device Auth Token
- worker sees trains only before clearance
- master can review worker access requests for trains they manage
- clearance can be remote or RFID-backed
- live transit risk comes from GPS plus weight changes
- speed is derived in CargoGuardian from GPS history

## Demo Policy

`NEXT_PUBLIC_DEMO_MODE` has one job:

- when `true`, start the simulator
- when `false`, do not start the simulator

It must not:

- inject fake trains
- inject fake dashboard counts
- change auth rules
- change routing
- add demo labels or demo badges in the UI

## Completed Through Phase 5

- Auth, onboarding, and admin invite flow
- Protected app shell
- Fleet list and train detail
- Admin-only Add Train flow
- Manual Blynk device linking during train creation
- Auth Token stored on the train after linking
- Unified Train = Device architecture
- Telemetry ingest endpoint
- Demo simulator using one dedicated demo train code
- Role-scoped access APIs
- Worker clearance-scoped visibility foundation
- Master approval foundation for worker requests

## Next Phase

The next implementation phase is:

- [phase-06-telemetry.md](./phase-06-telemetry.md)
