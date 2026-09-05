# TimeFlow Agent Guide

## Project Context

TimeFlow is a private, Spanish-language, multi-company time-tracking application. Users record active work and explicit breaks, review an auditable daily history, and inspect productivity metrics and example AI insights.

The repository contains two applications:

- `frontend/`: React 19, TanStack Start, TanStack Router, Vite 8, Tailwind CSS v4 and Recharts.
- `backend/`: NestJS 12, TypeORM, PostgreSQL and Vitest. The backend is under construction; the current product is primarily a high-fidelity frontend prototype.

Read `BRIEF.md` and `Prompt-idea-design.md` before making product, UX or architecture changes. The project constitution in `docs/constitution.md` defines the non-negotiable engineering principles.

## Repository Layout

- `frontend/src/components/`: shared application shell and UI primitives.
- `frontend/src/hooks/useTimeTracker.ts`: timer state machine and browser persistence.
- `frontend/src/lib/tracker.ts`: domain types, demo companies, formatting helpers and deterministic history.
- `frontend/src/routes/`: authenticated and authentication screens.
- `frontend/src/styles.css`: the complete visual token system.
- `backend/src/`: NestJS modules, providers, configuration, errors and migration scripts.

## Development Commands

Run commands from the relevant application directory.

### Frontend

```sh
cd frontend
npm run dev
npm run build
npm run lint
npm run format
```

### Backend

```sh
cd backend
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run migration:run
```

Do not assume a root-level `package.json` exists. Avoid committing generated output, local environment files or secrets.

## Implementation Rules

### Frontend

- Use TypeScript and preserve the existing TanStack Start and Router patterns.
- Keep user-visible copy in Spanish unless the surrounding feature establishes another language.
- Reuse existing UI primitives and shared components before introducing new ones.
- Keep components focused and avoid speculative abstractions.
- Preserve desktop, tablet and mobile behavior for every screen.
- Use semantic HTML, keyboard-accessible controls and visible focus states.
- Put colors, shadows and gradients in `frontend/src/styles.css` tokens. Components must not introduce ad-hoc color values.
- Preserve the “Prismatic Glass Instrument” visual language: clear glass-like surfaces, subtle prism rims, restrained spectrum washes and data-first layouts.
- Use Space Grotesk for interface text and JetBrains Mono for timers and numeric values. Use tabular numerals for counters.
- Restrict animation to the existing timer tick and active-state pulse unless a clear accessibility and product need justifies more.

### Timer and time data

- Preserve the state machine `IDLE -> WORKING <-> PAUSED -> IDLE`.
- Derive elapsed time from absolute `start` and `end` timestamps; never use an increment-only counter as the source of truth.
- Keep open segments representable and close them with a timestamp when a transition finishes the active period.
- Keep persistence SSR-safe and rehydrate browser state after mounting.
- Recalculate displayed time after `visibilitychange` so background tabs and suspended devices remain accurate.
- Keep timer state scoped to the active company. Never mix segments between companies.
- Validate manual ranges and preserve chronological ordering when adding manual work blocks.

### Backend and data

- Enforce company isolation in every authenticated query and mutation.
- Model memberships explicitly; a user may belong to multiple companies.
- Enforce one active work session per user and company.
- Keep breaks within their parent work session and calculate active time as work duration minus break duration.
- Use migrations for schema changes and validate DTOs at API boundaries.
- Return consistent errors through the existing backend error handling instead of leaking implementation details.

## Testing Expectations

- Run the narrowest relevant frontend lint/build or backend test first, then the broader check when practical.
- Add or update tests for timer transitions, timestamp-derived totals, company isolation, validation and API behavior.
- Test edge cases: reload during an open segment, background-tab recovery, finishing from work or break, invalid manual ranges and company switching.
- Do not treat demo data or mock AI insights as production behavior.

## Scope Boundaries

The current prototype does not include real Google OAuth, production persistence, company invitations, live AI insights, exports, notifications or approval workflows. Do not implement these implicitly while changing an unrelated feature; document and scope them explicitly.
