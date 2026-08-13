# Spec: FE-TAMI Frontend Foundation

## Objective

Create a clean, runnable React frontend foundation for the TAMI ERP project
using the TailAdmin React dashboard as the visual and layout baseline. This
phase establishes application structure and engineering tooling only; it does
not implement BOM, PO, master-data, admin, or audit business behavior.

## Tech Stack

- React 19 + TypeScript 5.7
- Vite 6
- Tailwind CSS 4.0.8, pinned with its PostCSS adapter
- React Router DOM 7
- Axios
- TanStack Query 5
- React Hook Form + Zod
- Zustand
- Vitest + Testing Library React
- ESLint + Prettier

Dependencies are pinned to stable versions in `package.json` and locked in
`package-lock.json` for reproducible installation.

## Commands

```text
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:run
npm run build
npm run audit
```

## Project Structure

```text
src/
├── pages/{bom,po,masters,audit,admin,auth}
├── components/{shared,features,layout}
├── hooks/
├── types/
├── lib/
└── config/
```

TailAdmin's reusable layout and visual primitives remain available under the
new shell. Demo-only pages and routes are removed from the application entry
point rather than copied into ERP modules.

## Code Style

New application code uses TypeScript and named exports where practical. Pages
are focused route-level components, shared controls are composed from small
accessible primitives, and server-state concerns stay in TanStack Query.

```tsx
export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <section aria-labelledby="page-title" className="space-y-6">
      <h1 id="page-title" className="text-title-md font-semibold text-gray-900">
        {title}
      </h1>
      <p className="text-theme-sm text-gray-500">Module foundation ready.</p>
    </section>
  );
}
```

## Testing Strategy

- Vitest is the test runner.
- Testing Library React is available for component and route smoke tests.
- Infrastructure behavior is covered with focused tests for route rendering,
  API-client configuration, and environment parsing where practical.
- The full suite runs with `npm run test:run`.

## Boundaries

- Always: keep the old `FE-Demo-First` project untouched; keep the TailAdmin
  source untouched; use `.env.example` for configuration; run checks before
  committing; keep one npm lockfile in this project.
- Ask first: adding backend behavior, authentication flows, real API contracts,
  database integration, CI/deployment, or changing the chosen baseline.
- Never: commit `.env` secrets, copy old ERP business modules into this
  foundation, force audit remediation, or delete source files outside `FE-TAMI`.

## Success Criteria

- `FE-TAMI` is an independent Git repository based on TailAdmin React.
- Only the required application routes are registered.
- Required folder structure and placeholder pages exist.
- TypeScript strict compilation succeeds.
- Axios and TanStack Query are configured and used by the app provider.
- `npm run dev`, `npm run test`, `npm run lint`, and `npm run build` work.
- `npm audit --audit-level=moderate` reports no unresolved vulnerabilities.
- No changes are made to `FE-Demo-First` or `_tailadmin_react_source`.

## Open Questions

- No backend URL is known yet, so the default API base URL is a local placeholder
  and is exposed only through Vite environment variables.
- Authentication is represented by a login route only; real session behavior is
  intentionally deferred.
