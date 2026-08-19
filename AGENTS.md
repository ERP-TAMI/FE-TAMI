# Frontend agent instructions

Read `ARCHITECTURE.md` before creating, moving, or substantially changing a
file under `src/`. It is the source of truth for the frontend's target layout
and feature conventions.

## Required placement rules

- Create new ERP business UI under `src/features/`, organized by bounded
  context and feature: `src/features/<context>/<feature>/`.
- A feature owns its pages, components, API functions, TanStack Query hooks,
  schemas, domain types, UI store, constants, utilities, tests, and optional
  route contribution. Do not split a feature across root-level `pages`,
  `components`, `hooks`, or `types` directories.
- Put only business-agnostic, reusable UI in `src/shared/`. A component that
  knows a domain such as purchase orders, materials, or BOM belongs in its
  feature.
- Keep the shared Axios client and technical browser services in
  `src/services/`; do not create Axios instances inside a feature.
- Use TanStack Query for server state, Zustand for UI-only client state, and
  React Hook Form + Zod for forms and validation.

## Transition rule

The current root-level `pages/`, `components/`, `hooks/`, `types/`, `context/`,
and `lib/` directories are legacy application-shell code. Do not move or rename
them as part of another task. New business features use `src/features/`; move
legacy code only in an explicitly approved refactor.

## Before finishing

- Compose a feature's routes through the application router; do not add a large
  route tree directly to `App.tsx`.
- Add focused tests alongside the feature and use shared test helpers for
  cross-feature tests.
- Run the relevant checks in `ARCHITECTURE.md`.
