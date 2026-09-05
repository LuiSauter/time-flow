# TimeFlow Constitution

**Version:** 1.0  
**Status:** Active  
**Language:** Spanish for product-facing experiences

## Purpose

This document defines the principles that govern product, design and engineering decisions in TimeFlow. It applies to both the frontend prototype and the planned NestJS/PostgreSQL backend.

## Principles

### 1. Privacy and Tenant Isolation

Time records are private to the authenticated user and the selected project. Every persisted record, query, mutation and derived metric must be scoped by the authorized user and project ownership. A project switch must never expose or combine another project's sessions, breaks or metrics.

### 2. Temporal Accuracy Is the Source of Truth

Time must be represented by absolute timestamps, not by an incrementing counter. Durations are derived from `start` and `end`, including when a tab is backgrounded, the device sleeps or the page reloads. The UI clock is a projection of the domain state, not the domain state itself.

### 3. Explicit State Transitions

The tracker has exactly three operational states: `IDLE`, `WORKING` and `PAUSED`. Valid transitions are:

```text
IDLE -> WORKING -> PAUSED -> WORKING
                     |
                     v
                    IDLE
WORKING ------------> IDLE
```

Actions must make invalid transitions impossible or safely no-op. Finishing a day closes any open segment and leaves the tracker idle.

### 4. Auditable Records

Every work or break segment has an identity, kind, label and absolute start time. Open segments are explicit until closed. Manual entries must preserve their origin, range and ordering so corrections remain understandable and reviewable.

### 5. Domain Integrity

In the persistent model:

- A user may own multiple projects.
- A user may have at most one active work session per project.
- A break belongs to a work session and stays within its time range.
- Active time equals work time minus break time.
- Daily goals and project time zones are project-level configuration.

Database constraints and service validation should enforce these rules; frontend validation alone is insufficient.

### 6. Data-First Product Design

The interface prioritizes current state, elapsed time, active work, breaks and compliance. Decorative treatment must not compete with primary data. Loading, empty, error and completed states must communicate what the user can do next.

### 7. Consistent Visual System

The visual language is “Prismatic Glass Instrument”: clear surfaces, subtle prism edges, soft spectral gradients and restrained motion. All colors, shadows, gradients and semantic status colors are tokens in `frontend/src/styles.css`. Components must consume tokens rather than hardcode visual values.

Status semantics remain stable:

- Work: active/positive.
- Break: pause/attention.
- Stop: finished/destructive.
- Neutral: idle/inactive.

Timers and metrics use JetBrains Mono with tabular numerals; interface text uses Space Grotesk.

### 8. Responsive and Accessible by Default

Desktop supports full navigation, four-column metrics and side-by-side analytics. Tablet stacks analytical content and uses two-column metrics. Mobile gives the timer primary width, keeps metrics readable, and permits horizontal table scrolling without hiding data.

Interactive controls must be keyboard accessible, have an identifiable focus state, expose meaningful labels, and respect reduced-motion preferences where animation is used.

### 9. Typed Boundaries and Validated Inputs

TypeScript domain types describe timer, project and record shapes. API DTOs validate external input. Date/time ranges, project identifiers, ownership access and manual entries must be validated at boundaries before business logic runs.

### 10. Safe Persistence and SSR Compatibility

Browser-only storage is accessed only after the client is available. Rehydration must not introduce server/client render mismatches. Persisted data is versioned, parsed defensively and treated as untrusted input. Production persistence will move to the backend without weakening the domain invariants.

### 11. Testable Behavior

Tests should target business behavior rather than implementation details. Minimum coverage for the tracker includes transitions, open-segment totals, reload/rehydration, visibility recovery, manual blocks, project switching and reset. Backend tests must cover authorization, project isolation, constraints, validation and error responses.

### 12. Explicit Scope and Evolution

The prototype currently uses deterministic demo data, browser persistence, demo authentication and example AI insights. Production database persistence, project collaboration, live AI, exports, notifications and approval workflows require explicit design and security review before implementation.

Changes that affect these principles must update this constitution and include the reason, migration impact and verification strategy.

## Decision Record

The current implementation favors a small frontend hook and derived totals because it keeps timer behavior deterministic and SSR-safe while the backend is not connected. Future API work must preserve the same state and timestamp semantics rather than reimplementing elapsed time as a server- or client-side ticking counter.
