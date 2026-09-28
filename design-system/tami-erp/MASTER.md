# TAMI ERP Design System

## Source of truth

FE-TAMI is React 19, Tailwind CSS v4, and the TailAdmin design system. Prefer the existing TailAdmin components and tokens in `src/components/shared/`, `src/components/features/`, and `src/layout/`. Keep spacing, type, borders, and color consistent with nearby maintained screens.

## Visual language

- Use compact, information-first layouts for ERP dashboards and tables.
- Use the existing brand blue for navigation and primary data; use semantic success, warning, and error colors only for status.
- Use existing gray surface and border colors in light and dark mode. Avoid gradients, oversized hero sections, heavy shadows, and decorative animation.
- Use existing system typography; do not load external fonts for a single feature.

## Interaction and accessibility

- Use semantic headings, labels, tables, and buttons. All interactive controls need a visible keyboard focus state and pointer cursor.
- Do not use emoji as icons; use Lucide SVG icons.
- Maintain at least 4.5:1 contrast for normal text in both themes. Status always includes text, not color alone.
- Respect reduced motion. Use loading skeletons for asynchronous content and explicit retry/empty states.
- At narrow widths keep key information readable without forcing the whole page to scroll horizontally. Use responsive cards when a dense table cannot fit.

## Data display

- Format dates and numbers for Vietnamese users.
- Make the selected reporting period visible beside its data.
- Keep KPI counts and list filters sourced from the same backend definition.
- Paginate large result sets on the server; never calculate page totals from the visible rows only.
