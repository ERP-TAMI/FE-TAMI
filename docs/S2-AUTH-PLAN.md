# S2-AUTH: Kế hoạch triển khai Authentication & Authorization (Frontend)

## Status
S2-AUTH-04: code xong, test đầy đủ (unit/component + tích hợp thật với BE qua Vite proxy), PR đang mở (https://github.com/ERP-TAMI/FE-TAMI/pull/15). S2-AUTH-05 (phần FE) chưa bắt đầu.

## Scope
Tài liệu này lên kế hoạch cho 2 nhánh việc thuộc repo `FE-TAMI`:

| Ticket | Nội dung | Branch |
|---|---|---|
| S2-AUTH-04 | Màn hình đăng nhập, session store, route guard, tự động refresh | `feat/Nguyen_S2-AUTH-04-login-ui-guard` |
| S2-AUTH-05 (phần FE) | Component test đăng nhập/redirect, rà soát CORS/cookie phía client | `feat/Nguyen_S2-AUTH-05-fe-auth-tests` |

## Quyết định kỹ thuật đã chốt
1. **Không lưu access token hay refresh token vào `localStorage`/`sessionStorage`.** Access token chỉ giữ trong memory (zustand store, không dùng middleware `persist`). Refresh token là httpOnly cookie do BE set — FE không bao giờ đọc được refresh token bằng JS.
2. **Cơ chế làm mới phiên** — 3 lớp, không phải "cứ F5 là gọi":
   - **Bootstrap 1 lần lúc app khởi động**: vì access token ở memory nên mất khi tải lại trang → gọi `/auth/refresh` một lần khi app mount để khôi phục phiên từ cookie.
   - **Timer chủ động**: sau khi có access token, decode `exp` claim, đặt `setTimeout` gọi refresh trước ~60 giây so với lúc hết hạn thật (access token TTL 15 phút → refresh ở phút thứ 14).
   - **Interceptor 401 dự phòng**: bắt lỗi 401 từ bất kỳ API call nào (trừ chính `/auth/login`, `/auth/refresh`), dùng **single-flight** (nhiều request 401 cùng lúc chỉ trigger 1 lần gọi `/auth/refresh`, các request còn lại đợi chung promise đó) + cờ `_retried` trên request để **chỉ retry đúng 1 lần** — chống lặp vô hạn khi refresh cũng fail.
   - Nếu refresh thất bại ở bất kỳ lớp nào → clear session, điều hướng `/login`.
3. `axios` instance dùng `withCredentials: true` để cookie refresh được gửi kèm mọi request tới BE.
4. **Quy trình PR**: Claude tự `git push` + `gh pr create` cho từng task, xác nhận với user trước mỗi lần tạo PR. Mỗi task 1 PR riêng.

Nguồn tham khảo pattern trên: xem mục cuối `Erp-BE/docs/S2-AUTH-PLAN.md`.

## ⚠️ Bug thực tế đã gặp và fix trong quá trình tích hợp: mất phiên khi F5
Khi test tích hợp thật (FE dev server qua Vite proxy `/api` → BE), phát hiện F5 luôn mất phiên dù `/auth/refresh` hoạt động đúng khi gọi trực tiếp vào BE. Nguyên nhân: BE set cookie `refresh_token` với `Path=/auth`, nhưng từ góc nhìn trình duyệt, FE gọi API ở path `/api/auth/refresh` (qua proxy) — path này **không match** `/auth` theo RFC 6265, nên trình duyệt không gửi cookie lại. Đã fix ở phía BE (`Erp-BE` PR #22): đổi `REFRESH_COOKIE_PATH` thành `/`. Xác nhận lại bằng cách replay chính xác luồng login → refresh qua Vite proxy với cookie jar của curl (enforce path-matching giống trình duyệt) — sau fix, refresh trả 200 đúng.

**Bài học cho các task sau**: bất kỳ cookie nào BE set để FE dùng qua reverse proxy nên dùng `Path=/` trừ khi có lý do thật sự phải giới hạn hẹp hơn, và phải test qua đúng đường đi thật (qua proxy), không chỉ test thẳng vào BE.

## Nhánh & Worktree

Base: `origin/dev`. `05-fe` stack lên `04` (branch từ branch 04, rebase lên dev khi 04 đã merge).

| Task | Worktree path | Branch | Base |
|---|---|---|---|
| S2-AUTH-04 | `E:\Project\Startup-Project\ERP-May\FE-TAMI-auth-04` | `feat/Nguyen_S2-AUTH-04-login-ui-guard` | `origin/dev` |
| S2-AUTH-05-FE | `E:\Project\Startup-Project\ERP-May\FE-TAMI-auth-05fe` | `feat/Nguyen_S2-AUTH-05-fe-auth-tests` | `feat/Nguyen_S2-AUTH-04-...` (stacked) |

```bash
git fetch origin
git worktree add ../FE-TAMI-auth-04 -b feat/Nguyen_S2-AUTH-04-login-ui-guard origin/dev
```

## Kiến trúc đã triển khai (S2-AUTH-04)
- `src/store/authStore.ts` — zustand, không persist: `status` (`idle|loading|authenticated|unauthenticated`), `user`, `accessToken`.
- `src/api/auth.schema.ts` / `src/api/auth.api.ts` — zod schema + `login`/`logout`/`me` (không có `refresh` riêng, xem bên dưới).
- `src/lib/jwt.ts` — `getJwtExpiryMs(token)`: decode phần payload JWT để lấy `exp`, không cần thêm thư viện.
- `src/lib/apiClient.ts` — `withCredentials: true`; request interceptor gắn `Authorization`; export `triggerRefresh()` (single-flight, tự cập nhật store) dùng chung bởi bootstrap, timer chủ động, và response interceptor 401 — tránh vòng phụ thuộc vòng tròn giữa `apiClient` ↔ `auth.api`.
- `src/hooks/useAuthBootstrap.ts` — chạy ở `App.tsx`: bootstrap 1 lần + effect đặt lại timer chủ động mỗi khi `accessToken` đổi.
- `src/routes/ProtectedRoute.tsx` — gate cho toàn bộ `AppLayout`.
- `src/pages/auth/LoginPage.tsx` — nối API thật, lỗi tiếng Việt theo mã lỗi BE (`INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_INACTIVE`, lỗi mạng).
- `src/layout/AppHeader.tsx` — hiện avatar/tên/vai trò người dùng + nút "Đăng xuất" thật (thay link "Login" tĩnh cũ).

## Hiện trạng đã khảo sát ban đầu (để không code lại cái đã có)
- Stack: React 19 + Vite 6 + react-router-dom 7 + zustand + @tanstack/react-query + react-hook-form + zod + axios + Tailwind 4. Test: Vitest + Testing Library (không có Playwright/Cypress).
- `src/pages/auth/LoginPage.tsx` ban đầu chỉ có UI tĩnh, chưa nối API — đã rewire ở S2-AUTH-04.
- `src/lib/apiClient.ts` ban đầu là axios instance trơn, chưa có interceptor — đã bổ sung.
- `src/lib/apiError.ts` đã có sẵn mapping mã lỗi BE → tiếng Việt — đã bổ sung 2 mã `ACCOUNT_LOCKED`, `ACCOUNT_INACTIVE`.

## Task 2 — S2-AUTH-05 (phần Frontend): Kiểm thử & nghiệm thu (chưa bắt đầu)

### Component test cần bổ sung
- `apiClient` interceptor test cho case 401 → retry → thành công (đã có phần single-flight ở `apiClient.test.ts` từ S2-AUTH-04, cần bổ sung case retry-through-response-interceptor đầy đủ nếu có thời gian).
- Test cho `useAuthBootstrap` schedule lại timer đúng khi access token đổi.

### Rà soát thủ công (checklist, ghi kết quả vào PR description)
- [ ] Không có `password`/token nào lộ ra console.log hay bị log lại ở bất kỳ đâu trong code FE.
- [ ] `apiClient` có `withCredentials: true`; xác nhận cookie refresh được gửi kèm khi gọi từ FE thật qua đúng path proxy (đã xác nhận ở S2-AUTH-04, re-verify sau khi BE PR #22 merge).
- [ ] Test full flow thật với BE chạy local: login → F5 → refresh tự động → logout → thử gọi lại API bảo vệ bằng token cũ → phải bị từ chối.

### Acceptance checklist
- [ ] `npm run lint && npm run build && npm run test:run` đều pass.
- [ ] Có báo cáo kết quả test đính kèm PR.

## PR Links

| Task | Branch | PR |
|---|---|---|
| S2-AUTH-04 | `feat/Nguyen_S2-AUTH-04-login-ui-guard` | https://github.com/ERP-TAMI/FE-TAMI/pull/15 |
| S2-AUTH-05 (FE) | `feat/Nguyen_S2-AUTH-05-fe-auth-tests` | _(điền sau khi tạo)_ |

## Deferred (ngoài phạm vi Sprint này)
- Đổi mật khẩu bắt buộc lần đầu (`must_change_password`) — cột đã có sẵn ở BE nhưng chưa có luồng UI.
- Quản lý nhiều vai trò/user (UI admin) — Sprint này mỗi user chỉ 1 vai trò, chưa có màn hình gán quyền.
- "Nhớ đăng nhập" / đăng nhập đa thiết bị nâng cao (ngoài việc `user_sessions` vốn đã hỗ trợ nhiều session/thiết bị ở tầng dữ liệu).

## Related Files
- `src/pages/auth/LoginPage.tsx`, `src/App.tsx`, `src/layout/AppHeader.tsx`, `src/lib/apiClient.ts`, `src/lib/apiError.ts`, `src/store/authStore.ts`, `src/routes/ProtectedRoute.tsx`, `src/hooks/useAuthBootstrap.ts`
- `docs/FE-INIT-002-SPEC.md` (mục "Deferred Work" đã liệt kê rõ "Authentication and authorization behavior" là phần được chuyển sang ticket này)
- `Erp-BE/docs/S2-AUTH-PLAN.md` (API contract phía BE, bao gồm chi tiết bug cookie path đã fix)
