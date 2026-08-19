# Frontend Architecture and Source Layout

## Purpose

`FE-TAMI` is the React frontend for the TAMI apparel ERP. The target design is
**feature/domain-first**: all code needed to deliver an ERP workflow is kept
close together, rather than distributed across global `pages`, `components`,
`hooks`, and `types` folders.

This document is the source of truth for contributors and Codex when creating
new frontend files. The local `AGENTS.md` makes the rules available to future
Codex sessions.

## Stack and quality commands

| Area | Standard |
| --- | --- |
| UI | React 19 + TypeScript strict mode |
| Build and styling | Vite 6 + Tailwind CSS 4 |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| HTTP | Axios, through one shared client |
| Client/UI state | Zustand 5 |
| Forms | React Hook Form + Zod |
| Tests | Vitest + Testing Library |

```powershell
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run audit
```

## Target source tree

```text
src/
├─ app/                            # Application shell: App, router, providers, app-wide store
│  ├─ router/                      # Route composition, guards, route paths
│  └─ providers/                   # Query, theme, auth, and app providers
├─ layout/                         # App shell, header, sidebar, backdrop, navigation config
├─ features/                       # Canonical location for new ERP business features
│  ├─ auth/
│  ├─ dashboard/
│  ├─ admin/                       # users, roles, permissions
│  ├─ organization/                # employees, departments, positions
│  ├─ master-data/                 # materials, products, colors, sizes, units, partners
│  ├─ bom/
│  ├─ purchasing/                  # requests, orders, receipts
│  ├─ inventory/                   # warehouses, stock, movements
│  ├─ production/                  # planning, orders, cutting, sewing, finishing, QC
│  ├─ sales/
│  ├─ accounting/
│  └─ audit/
├─ shared/                         # Reusable code with no ERP-domain knowledge
│  ├─ components/ hooks/ types/ schemas/ constants/ enums/ utils/
├─ services/                       # Technical browser services
│  ├─ api/                         # Axios client, interceptors, normalized API errors
│  ├─ storage/
│  └─ download/
├─ config/                         # Environment parsing and application configuration
├─ assets/                         # Images, fonts, global styles
├─ icons/
├─ test/                           # Test setup, mocks, fixtures, render helpers
├─ main.tsx
└─ vite-env.d.ts
```

Only create directories when a real feature requires them; Git does not retain
empty folders.

## Feature template

Use `src/features/<feature>/` for an independent feature, or
`src/features/<context>/<feature>/` when several features belong to one ERP
context. For example, purchase orders live at
`src/features/purchasing/purchase-orders/`.

```text
<feature>/
├─ pages/                          # Route-level views
├─ components/                     # UI specific to this feature
├─ api/
│  ├─ <feature>.api.ts             # HTTP calls only
│  └─ <feature>.keys.ts            # TanStack Query key factory
├─ hooks/                          # Queries and mutations; no raw Axios in components
├─ schemas/                        # Zod schemas and inferred form values
├─ types/                          # Feature/domain types
├─ stores/                         # Zustand UI state only, when needed
├─ constants/
├─ utils/
├─ routes.tsx                      # Optional feature route contribution
├─ index.ts                         # Intentional public exports only
└─ tests/
```

Omit a directory when it has no responsibility yet. Do not create empty
placeholder folders.

## Data and component flow

```text
Page → feature component → RHF + Zod → TanStack Query hook
     → feature API function → shared Axios client → NestJS REST API
```

- Pages compose a workflow and route-level layout; they do not contain raw HTTP
  calls.
- Feature components know the ERP domain. Generic controls such as `Button`,
  `Input`, `Modal`, `Table`, and `Pagination` belong in `shared/components/`.
- API modules make HTTP calls and normalize only feature-specific payloads.
- Query hooks own loading, cache invalidation, and mutation lifecycle.
- Do not store backend records in Zustand. TanStack Query owns server state;
  Zustand is for UI state such as a filter panel, a selected warehouse, or
  column preferences.
- Keep Zod schemas next to the feature and derive form value types from them
  when possible, preventing schema/type drift.

## Routing and navigation

- The application router composes small route exports from features. Do not
  grow a large route definition directly in `App.tsx`.
- Route guards and route paths are application concerns and belong below
  `app/router/`.
- Sidebar/menu items are configuration under `layout/navigation/`, not a long
  hard-coded conditional in `AppSidebar.tsx`. A navigation item may declare
  its permission and route path.
- A feature route must use the same domain vocabulary as its backend API. For
  example: `features/purchasing/purchase-orders/` maps naturally to the
  purchase-order backend domain.

## Placement rules

| Code kind | Place it in |
| --- | --- |
| Purchase-order table, material form, BOM tree | Owning feature's `components/` |
| Generic button, modal, pagination, input | `shared/components/` |
| Generic pagination or API response type | `shared/types/` |
| Type/schema/query specific to one business feature | That feature's `types/`, `schemas/`, or `hooks/` |
| Axios client, interceptors, common API error type | `services/api/` |
| Route guard, provider, application-wide query setup | `app/` |
| Sidebar/header/app shell | `layout/` |
| Shared fixtures and render helper | `test/` |

`shared/` is not a catch-all. Move code there only after it is used by at
least two unrelated features and its public API is stable.

## Naming and testing conventions

- Directories and utility filenames use kebab-case:
  `purchase-orders/`, `purchase-order.api.ts`.
- React components and pages use PascalCase:
  `PurchaseOrderListPage.tsx`, `PurchaseOrderForm.tsx`.
- Hooks start with `use`: `usePurchaseOrders.ts`.
- Query keys use the feature key factory, never scattered string literals.
- Store names clarify that they are UI state: `purchase-order-ui.store.ts`.
- Put focused component, hook, and page tests in the feature's `tests/`
  directory; shared setup/mocks/fixtures stay in `src/test/`.
- Validate forms through RHF and Zod. Surface server-side validation errors in
  the relevant form rather than silently swallowing them.

## Transition from the current layout

The application currently has a working TailAdmin-based shell with root-level
`pages/`, `components/`, `hooks/`, `types/`, `context/`, and `lib/` folders.
These are legacy locations, not a mandate to rewrite working UI now.

1. New ERP business work starts under `src/features/`.
2. Existing imports and routes stay unchanged unless the task explicitly
   includes migration.
3. Move a legacy page together with its related components, hooks, types, and
   tests in a dedicated, tested refactor.
4. After a migration, update route composition and remove the old path in that
   same approved refactor.
5. Move application shell infrastructure to `app/`, `shared/`, and `services/`
   gradually; do not mix that migration with business feature delivery.

## Boundaries for Codex and contributors

Always:

- Follow the feature template and keep a business workflow in one feature.
- Use the shared API client and feature-owned TanStack Query hooks.
- Add accessible labels, keyboard behavior, loading, empty, and error states
  for user-facing components.
- Run the relevant typecheck, lint, test, and build commands before handoff.

Ask first:

- Moving legacy folders or changing the app shell/router foundation.
- Adding an npm dependency, changing the shared API client, or changing global
  state/provider architecture.
- Changing auth/session handling, permissions, or a public route contract.

Never:

- Add ERP-specific components or types to `shared/`.
- Call Axios directly from a React component or create a feature-local Axios
  instance.
- Use Zustand as a cache for backend data already managed by TanStack Query.
- Commit `.env` values, API credentials, or generated build output.
