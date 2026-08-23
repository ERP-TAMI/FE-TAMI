# S2-AUTH-05 (Frontend): Báo cáo kiểm thử & nghiệm thu

Phạm vi: toàn bộ luồng auth FE đã build ở S2-AUTH-04 (#15, merged) — màn hình đăng nhập, session store, route guard, tự động refresh. Xem thêm `Erp-BE/docs/S2-AUTH-05-BE-TEST-REPORT.md` cho phần BE.

## 1. Kết quả chạy test tự động

| Bộ test | Số lượng | Kết quả |
|---|---|---|
| Vitest — toàn bộ suite (21 file) | 76 (1 skip) | ✅ pass |
| — trong đó `LoginPage.test.tsx` (thành công / sai mật khẩu / tài khoản khoá / lỗi mạng / loading) | 5 | ✅ pass |
| — `ProtectedRoute.test.tsx` (loading / redirect / render khi đã đăng nhập) | 3 | ✅ pass |
| — `apiClient.test.ts` (single-flight refresh) | 4 | ✅ pass |
| — `App.test.tsx` (route wiring) | 7 (1 skip*) | ✅ pass |
| `npm run typecheck` | — | ✅ sạch |
| `npm run lint` | — | ✅ sạch |
| `npm run build` | — | ✅ sạch |
| **Playwright (browser Chromium thật, chạy với BE thật)** | 5 (1 skip*) | ✅ pass |

\* 1 test skip ở cả 2 bộ vì phụ thuộc `AUTH_GUARD_ENABLED` đang tắt tạm (xem `docs/S2-AUTH-PLAN.md`), logic guard vẫn được test đầy đủ qua `ProtectedRoute.test.tsx` (không phụ thuộc flag này).

## 2. Kiểm thử bằng browser thật (Playwright, mới thêm ở S2-AUTH-05)

Trước S2-AUTH-05, việc "test UI" chỉ dừng ở test component (jsdom, không phải trình duyệt thật) và kiểm tra bằng mắt qua screenshot thủ công — không đủ để bắt được lỗi liên quan hành vi trình duyệt thật (cookie path, redirect thật). Cài `@playwright/test` + Chromium, chạy `e2e/auth.spec.ts` nhắm vào FE dev server thật (proxy `/api` → BE thật):

- [x] Sai mật khẩu → hiện đúng lỗi tiếng Việt.
- [x] **Đăng nhập → F5 (reload thật) → vẫn còn phiên, không bị đá về `/login`** — đây chính là test hồi quy cho bug cookie path đã tìm và fix trong lúc làm S2-AUTH-04.
- [x] Đăng xuất xong chuyển về `/login`.
- [x] Đã đăng nhập mà vào `/login` → tự chuyển về `/dashboard`.
- [x] **Mới ở S2-AUTH-05**: sau khi đăng nhập, `localStorage`/`sessionStorage` không chứa mật khẩu, không chứa chuỗi giống JWT (`eyJ...`); `document.cookie` (JS) không thấy `refresh_token`; cookie đó có `httpOnly=true` và `sameSite=Lax` (verify qua `context.cookies()` của Playwright, không phải suy đoán).

## 3. Danh sách lỗi phát hiện trong quá trình kiểm thử (lũy kế từ S2-AUTH-04)

| # | Mô tả | Trạng thái |
|---|---|---|
| 1 | Cookie `refresh_token` phía BE set `Path=/auth`, không khớp path `/api/auth/refresh` mà FE gọi qua Vite proxy → mất phiên khi F5. Phát hiện lúc test tích hợp thật (không phải test đơn vị). | ✅ Đã fix ở BE (`Erp-BE` PR #22, trước khi merge). Có test hồi quy Playwright riêng để không tái phát. |
| 2 | Header hiển thị tên người dùng và vai trò trùng chữ ("Quản trị hệ thống · Quản trị hệ thống") với tài khoản SA, nhìn rối. | ✅ Đã fix — đổi sang avatar + tên/vai trò xếp tầng rõ ràng (PR #15). |

## 4. Rà soát theo yêu cầu "CORS, cookie/header, chính sách refresh token" (góc nhìn từ FE)
- `apiClient` dùng `withCredentials: true` → cookie `refresh_token` được gửi kèm đúng các request tới BE cùng origin (qua proxy dev, và cùng domain khi build production đứng sau cùng 1 reverse proxy).
- Access token **không bao giờ** được lưu vào `localStorage`/`sessionStorage` — verify bằng Playwright ở mục 2 (không phải chỉ đọc code).
- Interceptor 401 dùng single-flight (`apiClient.test.ts`: nhiều request 401 cùng lúc chỉ gọi 1 lần `/auth/refresh`) + cờ `_retried` chống lặp vô hạn.
- Phần cấu hình CORS thật sự nằm ở BE (`origin: true`) — đã rà soát chi tiết trong báo cáo BE, kết luận: chấp nhận được cho giai đoạn hiện tại nhờ `SameSite=Lax` + access token qua header, khuyến nghị siết lại trước khi lên production.

## 5. Trạng thái tạm thời cần nhớ
- `AUTH_GUARD_ENABLED = false` trong `src/App.tsx` — route guard đang tắt để không chặn các tính năng khác đang code song song. **Cần bật lại `true` và un-skip 2 test đã skip** (1 ở `App.test.tsx`, 1 ở `e2e/auth.spec.ts`) khi các tính năng khác code xong, cùng lúc với việc làm S2-AUTH-03 ở BE.

## 6. Kết luận
Toàn bộ acceptance của S2-AUTH-05 (phần FE) đạt: lint/typecheck/build/vitest/Playwright đều pass, có báo cáo test này, danh sách lỗi đã cập nhật (2 lỗi phát hiện trong quá trình làm, cả 2 đã fix và có test hồi quy).
