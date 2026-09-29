# Management PO Overview

Follow the TAMI ERP master design system and current TailAdmin primitives.

## Information hierarchy and layout

- Keep the page compact: title and month filter, three KPI cards, then the PO list.
- Keep the title area compact and remove repeated eyebrow text.
- Use a three-column KPI grid at wide desktop, two columns at tablet, and one on mobile.
- Keep each KPI card around 128–152px high with the icon beside the label and value.
- Use the existing blue, danger, and neutral card tones; overdue and upcoming cards remain distinguishable by label and number as well as color.
- Use one outer border around the list and embed the shared TailAdmin table inside it.
- On desktop, use explicit column proportions totaling 100%; reserve space for PO codes and customer names.
- Keep PO identifiers on one line with ellipsis and expose the full value on hover.
- On widths below extra-large, render each PO as a compact card with code, customer, received date, deadline, and status. Use the shared table on wide screens.
- Show stacked PO details on narrow screens to avoid horizontal page scrolling.

## Business and data behavior

- Keep the labeled native month input visible and clickable; set its language to Vietnamese.
- Keep month selection labeled and keyboard accessible. A changed month starts at page one.
- Ignore an empty/invalid native month value so the last valid month stays selected and no `month=` request is sent.
- Cache each month/page/limit separately with TanStack Query. Keep previous data only while paging inside the same month, announce the update, and disable pagination until the new page arrives. Do not show another month's numbers under the newly selected month.
- Pass TanStack Query's `AbortSignal` to the shared Axios client so superseded requests are cancelled when the user changes filters quickly.
- Display date-only values in Vietnamese day/month/year order without local timezone shifts.
- Explain that deadline warning counts are evaluated against today's date, even for a historical month.
- The management list has exactly these columns: Mã PO, Khách hàng, Ngày nhận, Deadline xuất hàng, Còn/trễ, Trạng thái. Do not show an assignee.
- Prefer the API's Vietnam-date `managementStatus` and signed `daysToDeadline`; use the same Vietnam-date fallback rule only when these fields are absent.
- Management status order is cancelled → completed (`closed`/Final) → overdue for a non-final PO with a past deadline → not completed. Show “—” for Còn/trễ on completed and cancelled rows.
- Use blue for Chưa xong, green for Hoàn thành, red for Trễ hạn, and neutral gray for Đã hủy. Keep each status label visible so color is not the only signal.
- Keep all six fields available in the responsive mobile card layout as well as the wide table.
- Use existing status badges, shared pagination, and loading/error/empty patterns. Do not add charts or unrelated dashboard indicators.

## Copy and accessibility

- Describe the page as tracking delivery progress by month.
- Keep KPI helper copy short while retaining the rules for Final, cancelled, overdue, and upcoming PO.
- Keep compact TailAdmin spacing, visible focus rings, pointer cursors on controls, semantic warning colors, and readable status text in light/dark themes.

## Interaction and verification

- Month changes reset pagination to page one and keep the selected month in the URL.
- Preserve keyboard focus visibility for the month picker and PO links.
- Verify at 375px, 768px, 1024px, and 1440px, including loading, error, and empty states.
