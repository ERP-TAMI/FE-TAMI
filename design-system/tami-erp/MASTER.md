# TAMI ERP UI Design System

This file records the UI/UX Pro Max guidance adapted to the production TAMI ERP
frontend. Existing TailAdmin components and semantic theme tokens remain the
source of truth for implementation.

## Product direction

- Build compact, readable ERP screens that keep operational data above the fold.
- Preserve the existing TailAdmin shell, typography, spacing scale, and light/dark themes.
- Use the app's semantic `brand`, `success`, `warning`, `error`, and `gray` classes;
  do not add a new palette or load a second font for an individual page.
- Use Lucide SVG icons, subtle borders and shadows, and clear focus-visible states.
- Keep the meaning of a status visible in text as well as color.

## Layout and density

- Use the existing Tailwind spacing scale and prefer 12–20px component padding for
  data-dense screens.
- Keep card heights proportional to their content. Avoid oversized icon-first KPI cards.
- Use tables for desktop scanning, with explicit widths for long or important fields.
- Use truncation with an accessible full-value affordance for long identifiers.
- Keep page-specific visual changes local instead of changing shared components globally.
- Respect reduced-motion preferences and provide stable hover states without layout shifts.

## Accessibility and responsive behavior

- Maintain WCAG AA text contrast in light and dark themes.
- All interactive elements need a pointer affordance, keyboard access, and visible focus.
- Use labels for inputs and preserve native keyboard behavior when styling controls.
- Validate layouts at 375px, 768px, 1024px, and 1440px.
- Handle loading, error, empty, and populated states without blank content.
