# How To Continue CargoGuardian

This repository is intentionally being built phase-by-phase. Future agents and developers must continue in that same controlled order.

## Start Here

Read [../../AGENTS.md](../../AGENTS.md) first. It contains the repository-wide operating rules, system summary, documentation update requirements, and phase completion protocol.

## Mandatory Workflow

1. Read [../../AGENTS.md](../../AGENTS.md).
2. Read [PHASE_INDEX.md](./PHASE_INDEX.md).
3. Identify the next incomplete phase.
4. Read the full markdown file for that phase.
5. Inspect the current codebase before making assumptions.
6. Implement only that phase.
7. Validate the phase completely.
8. Update the planning docs to reflect completion or discovered deviations.
9. Stop before jumping to the next phase unless explicitly instructed.

## Hard Rules

- Do not skip phases.
- Do not implement unrelated features early.
- Do not replace architecture decisions without documenting why.
- Do not bypass server routes for external integrations.
- Do not expose Firebase Admin, Blynk, TigerGraph, or privileged Mapbox secrets to the client.
- Do not insert fake static operational data into production paths.
- If demo data is required, keep it behind `NEXT_PUBLIC_DEMO_MODE` and document the fallback.

## Expected Execution Pattern

For every phase:

1. Review the existing files listed in the phase document.
2. Create or update only the files owned by that phase.
3. Preserve the current working routes and do not break earlier phases.
4. Keep the app runnable throughout the work.
5. Add loading, empty, and error states for the new screens introduced in that phase.
6. Validate by running:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
7. Perform the phase-specific manual validation checklist.

## How To Mark Progress

- Update [PHASE_INDEX.md](./PHASE_INDEX.md) when a phase is completed.
- Add notes to the active phase file if implementation differed from the original plan.
- Update [GLOBAL_TODO.md](./GLOBAL_TODO.md) if new follow-up items are discovered.
- Keep README links in sync if new documentation files are added.
- Update `AGENTS.md` if a foundational architecture, workflow, or documentation rule changes.

## If You Encounter A Blocker

- First inspect the current code and the relevant phase file.
- If the issue is architectural, document the constraint in the current phase markdown.
- If the issue is environmental, update `.env.example` or docs rather than hardcoding.
- If a third-party integration is unavailable, implement graceful fallback behavior and document it.
- Do not silently move work into a later phase without recording it.

## Current State At Time Of Writing

- Phase 1 is complete.
- The project has a working Next.js foundation, base shell placeholders, UI primitives, environment scaffolding, Firebase bootstraps, and a health route.
- Authentication, business data flows, and integrations are not yet implemented.

## Next Expected Phase

The next implementation phase is:

- [phase-02-authentication.md](./phase-02-authentication.md)
