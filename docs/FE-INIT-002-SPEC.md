# FE-INIT-002: Refactor TailAdmin Templates and Organize Components

## Status

Completed

## Objective

Refactor the TailAdmin baseline into an ERP-oriented application shell for
TAMI. This task establishes reusable UI components, module page stubs, route
navigation, and verification coverage. Business workflows, API calls, and
data binding are intentionally deferred to later feature tasks.

## Scope Delivered

### ERP application shell

- Retained the TailAdmin root layout with responsive sidebar, header, and main
  content area.
- Updated sidebar navigation labels and entry points for ERP modules.
- Preserved the existing light/dark theme toggle.
- Kept the shell responsive for narrow screens through Tailwind responsive
  classes and the existing mobile sidebar behavior.

### Route structure

| Route | Behavior |
|---|---|
| `/login` | Public login page stub |
| `/dashboard` | Dashboard shell |
| `/bom` | BOM page stub |
| `/po` | Purchase order page stub |
| `/masters` | Redirects to `/masters/materials` |
| `/masters/materials` | Materials page stub |
| `/admin` | Redirects to `/admin/users` |
| `/admin/users` | Users page stub |
| `/audit-log` | Audit log page stub |
| Any unknown route | TailAdmin-based 404 page |

### Shared component library

Reusable components are located under `src/components/shared` and exported
through its index module:

- `Button`: variants, sizes, loading state, disabled state, and forwarded ref.
- `Input`: label, hint, error state, generated accessible id, and forwarded
  ref.
- `Select`: typed options, label, error state, and forwarded ref.
- `Table`: typed rows and columns, custom cell rendering, empty state, and
  responsive horizontal overflow.
- `Modal`: accessible dialog structure, Escape-to-close, overlay close, and
  optional footer.
- `Alert`: info, success, warning, and error variants.
- `Toast`: live status notification with dismiss action.

The login form consumes the shared `Input` and `Button` components. Placeholder
module pages consume the shared `Alert` component.

## Project Organization

```text
src/
├── components/
│   └── shared/       # reusable UI primitives and page foundation helpers
├── config/           # environment configuration
├── context/          # theme and sidebar providers
├── hooks/            # reusable application hooks
├── layout/           # ERP shell, header, sidebar, backdrop
├── lib/              # Axios and TanStack Query clients
├── pages/
│   ├── admin/
│   ├── audit/
│   ├── auth/
│   ├── bom/
│   ├── masters/
│   └── po/
├── types/            # shared TypeScript declarations
└── App.tsx           # route tree and application boundary
```

## Quality and Verification

The following checks pass for this task:

- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run test:run` — 3 test files, 6 tests passed
- `npm run build`
- `npm run audit` — 0 vulnerabilities
- No `console.log` calls remain in `src`.

Automated coverage includes shared Button rendering/click behavior, Login page
rendering, dashboard/login routes, and `/masters` and `/admin` redirects.

## Deferred Work

The following are intentionally outside FE-INIT-002:

- Authentication and authorization behavior.
- BOM, purchase order, master data, user, and audit-log data binding.
- API integration and real server error handling.
- Form validation with React Hook Form and Zod.
- Production-grade table pagination, filtering, sorting, and CRUD flows.
- Full browser E2E and visual regression coverage.

## Related Files

- `src/App.tsx`
- `src/layout/AppSidebar.tsx`
- `src/components/shared/index.ts`
- `src/pages/auth/LoginPage.tsx`
- `src/App.test.tsx`
- `src/components/shared/Button.test.tsx`
- `src/pages/auth/LoginPage.test.tsx`
