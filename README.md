# FE-TAMI

FE-TAMI is the clean frontend foundation for the TAMI ERP application. It is
based on the TailAdmin React dashboard shell and intentionally contains route
placeholders instead of ERP business workflows.

## Stack

- React 19 + TypeScript strict mode
- Vite + Tailwind CSS 4
- React Router DOM
- Axios + TanStack Query
- React Hook Form + Zod
- Zustand
- Vitest + Testing Library React
- ESLint + Prettier

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run audit
```

## Routes

The foundation currently exposes:

- `/login`
- `/dashboard`
- `/bom`
- `/po`
- `/masters/materials`
- `/admin/users`
- `/audit-log`

Business behavior for these modules will be added in separate feature tasks.

## Environment

Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` for the future API.
Never commit `.env` or real credentials.

## Baseline

The TailAdmin React source was copied locally from the official React baseline.
See [`docs/TAILADMIN_BASELINE.md`](docs/TAILADMIN_BASELINE.md) for provenance.
