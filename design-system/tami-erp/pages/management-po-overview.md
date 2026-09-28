# Management PO Overview

Follow the TAMI ERP master design system and current TailAdmin primitives.

- Keep the page compact: title and month filter, three KPI cards, then the PO list.
- Use the existing blue, danger, and neutral card tones; overdue and upcoming cards remain distinguishable by label and number as well as color.
- On widths below extra-large, render each PO as a compact card with code, customer, received date, deadline, and status. Use the shared table on wide screens.
- Keep month selection labeled and keyboard accessible. A changed month starts at page one.
- Ignore an empty/invalid native month value so the last valid month stays selected and no `month=` request is sent.
- Cache each month/page/limit separately with TanStack Query. Keep previous data only while paging inside the same month, announce the update, and disable pagination until the new page arrives. Do not show another month's numbers under the newly selected month.
- Pass TanStack Query's `AbortSignal` to the shared Axios client so superseded requests are cancelled when the user changes filters quickly.
- Display date-only values in Vietnamese day/month/year order without local timezone shifts.
- Explain that deadline warning counts are evaluated against today's date, even for a historical month.
- Use existing status badges, shared pagination, and loading/error/empty patterns. Do not add charts or unrelated dashboard indicators.
- Keep compact TailAdmin spacing, visible focus rings, pointer cursors on controls, semantic warning colors, and readable status text in light/dark themes.
- The management list has exactly these columns: Mã PO, Khách hàng, Ngày nhận, Deadline xuất hàng, Còn/trễ, Trạng thái. Do not show an assignee.
- Prefer the API's Vietnam-date `managementStatus` and signed `daysToDeadline`; while the S34-DASH-03/04 PRs are being integrated, accept the parent response and fall back to the same Vietnam-date rule only when these fields are absent.
- Management status order is cancelled → completed (`closed`/Final) → overdue for a non-final PO with a past deadline → not completed. Show “—” for Còn/trễ on completed and cancelled rows.
- Use blue for Chưa xong, green for Hoàn thành, red for Trễ hạn, and neutral gray for Đã hủy. Keep each status label visible so color is not the only signal.
- Keep all six fields available in the responsive mobile card layout as well as the wide table.
