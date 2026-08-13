# Implementation Plan: FE-TAMI Frontend Foundation

## Overview

Build a new TailAdmin-based React/TypeScript foundation in `FE-TAMI`, keeping
the existing ERP frontend and the TailAdmin source repository unchanged.

## Architecture Decisions

- Use the local TailAdmin React repository as a read-only baseline.
- Use React Router DOM for a declarative route tree with one retained TailAdmin
  root layout for protected application pages.
- Keep page modules as placeholder TypeScript pages until business tickets
  define their behavior.
- Use Axios for transport and TanStack Query for server-state readiness; no
  business API calls are introduced in this initialization task.
- Pin dependency versions and commit one npm lockfile.
- Use Vitest with a small route smoke test so the test command proves the new
  app mounts, while avoiding premature business tests.

## Task List

### Phase 1: Foundation

- [x] Copy the TailAdmin React baseline into `FE-TAMI` without its `.git`
  directory.
- [x] Replace demo application routes with the required ERP route skeleton.
- [x] Add the requested folder structure and page placeholders.

### Phase 2: Tooling and Runtime Boundaries

- [x] Pin and install the required runtime and test dependencies.
- [x] Configure strict TypeScript, Vite aliases, env parsing, Axios, and Query
  Client providers.
- [x] Configure `.env.example`, ESLint, Prettier, Vitest, and `.gitignore`.
- [x] Initialize the new local Git repository.

### Checkpoint: Foundation

- [x] The app mounts without console errors.
- [x] Required routes render through the retained TailAdmin layout.
- [x] No old project files are changed.

### Phase 3: Verification

- [x] Run typecheck, lint, focused tests, full tests, and production build.
- [x] Run the dev-server smoke check.
- [x] Run npm audit and record the result.

### Checkpoint: Complete

- [x] All FE-INIT-001 acceptance criteria pass.
- [x] Working tree contains only intentional FE-TAMI changes.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| TailAdmin source uses React Router package `react-router` | Medium | Replace the app boundary with `react-router-dom` and verify route tests. |
| Tailwind v4 PostCSS setup differs from older examples | Medium | Preserve the source's v4 adapter and verify with a production build. |
| Demo imports remain after route cleanup | High | Run typecheck, lint, and build after removing demo route imports. |
| Dependency advisories appear after install | High | Pin versions, use the lockfile, audit, and do not force-fix automatically. |

## Open Questions

- Real API/auth contracts are deferred to later tasks.
