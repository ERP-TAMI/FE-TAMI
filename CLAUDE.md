# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
cp .env.example .env     # VITE_API_BASE_URL=/api proxies to the backend, see vite.config.ts
npm run dev              # port 5173
npm run typecheck
npm run lint
npm run test:run         # vitest run (all)
npx vitest run src/api/po.api.test.ts    # single file
npm run test:e2e         # Playwright — requires FE (5173) AND BE (3000) already running, real login
npm run build            # runs typecheck first, then vite build
npm run format
```

## Architecture

- React 19 + TypeScript strict, Vite + Tailwind 4, TanStack Query + Axios, React Hook Form + Zod, Zustand, React Router 7. Path alias `@` → `src/`.
- **Three route areas**, each with its own layout and a route guard component gating on role/permission (`src/lib/areaAccess.ts`): employee (`AppLayout`, default), `management/*` (`ManagementLayout`, gated by `canAccessManagement`), `it/*` (`ItLayout`, gated by `roleCode === "IT"`). `getLandingPath(user)` decides which area a user lands in after login — check this before adding a new top-level route.
- **API layer**: one `*.api.ts` per domain in `src/api/`, using the shared `apiClient` (`src/lib/apiClient.ts`). `apiClient` attaches the JWT from `useAuthStore` and does single-flight refresh — concurrent 401s share one `/auth/refresh` call instead of each firing their own. Domains with query params also get a `*.schema.ts` (Zod) and a `*.keys.ts` (query key factory).
- **Data fetching**: hooks in `src/hooks/` wrap `*.api.ts` with TanStack Query. List/detail/document/product queries take an `{ enabled }` option — pages only turn a query on for the tab that's actually open, rather than fetching every tab's data on mount. Paginated queries include the page/limit in the query key so different pages cache independently; mutations invalidate the *un-paginated* key prefix (e.g. `productsOf(id)`, not `products(id, query)`) so every cached page gets refreshed, not just the one currently viewed.
- **Uploads to the backend go through presign → PUT S3 → confirm** (see `po.api.ts::uploadDocument`), matching the backend's storage design — never add a multipart/form-data upload path, the server doesn't accept raw file bodies for these resources.
- **Cross-page background work** (e.g. a multi-file upload) belongs in a Zustand store (see `useUploadStore.ts`) rendered from `AppLayout`, not component state — component state disappears on navigation even though the underlying async work keeps running, which reads as "it silently stopped."
- Category/status pickers that render a dropdown menu (see `PoDocumentCategoryPicker.tsx`) must portal into `document.body` and position with `fixed` + the trigger's `getBoundingClientRect()`. An `absolute`-positioned menu gets clipped by the nearest scrolling/overflow ancestor (modals in this app are `overflow-y-auto`), which is not obvious until the menu is opened inside one.
- `PoDetailPage.tsx` and `PoProductDetailPage.tsx` are the largest, most-edited pages (PO detail tabs, product detail tabs). Both derive `activeTab` from the URL path rather than separate state — check `getTabFromPath`/`handleTabChange` before adding a tab.
- **`bg-black`/`text-black` are not true black** — `index.css` redefines `--color-black: #101828` (a dark navy) for the design system. For an actual black backdrop (a fullscreen image viewer, say), use an arbitrary value like `bg-[#000]`.
- Page headers (breadcrumb on the right, title on the left) use the shared `PageHeader` component (`src/components/shared/PageHeader.tsx`), as in `PoDetailPage.tsx` and `StyleHeader.tsx` — don't hand-rope a new breadcrumb row per page.
