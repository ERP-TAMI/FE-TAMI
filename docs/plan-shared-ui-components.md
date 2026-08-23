# Plan: Đồng nhất UI + component dùng chung (Nhóm vật tư & Mẫu Fit)

**Trạng thái: đã làm xong.** Thực hiện ở branch `feat/Thang-shared-ui-components` (checkout từ `dev`), commit `155fa75`, PR: https://github.com/ERP-TAMI/FE-TAMI/pull/new/feat/Thang-shared-ui-components.

Lưu ý: các đường dẫn file nhắc tới trong plan bên dưới là đường dẫn tại thời điểm viết plan (trước khi tái cấu trúc thư mục xoá `src/features/`). Vị trí thực tế sau khi hoàn thành: Nhóm vật tư ở `src/pages/masters/`, `src/components/features/material-groups/`, `src/hooks/`, `src/api/`, `src/types/material-group.ts`; Mẫu Fit ở `src/pages/styles/`, `src/components/features/styles/`, `src/hooks/useStyles.ts`, `src/api/stylesApi.ts`, `src/types/style.ts`.

## Bối cảnh

Nhóm vật tư (`src/features/master-data/material-groups/`) và Mẫu Fit (`src/pages/styles/` + `src/components/features/styles/`) mỗi bên tự viết page-header, dialog xác nhận, toast/banner thông báo, và bảng dữ liệu riêng — dù `src/components/shared/` đã có sẵn `Table`, `Modal`, `Toast`, `Button`, `Alert`, `Input`, `Select` nhưng chỉ Nhóm vật tư dùng một phần (Table, Modal), Mẫu Fit gần như viết tay toàn bộ. Cần tạo bộ component/hook dùng chung để 2 module hiện có và các module sau (BOM, PO...) đều tái sử dụng được, tránh code lặp và UI lệch nhau.

## 5 mảnh cần tạo/mở rộng trong `src/components/shared/` (trừ ghi chú khác)

### 1. `PageHeader` (mới) — `src/components/shared/PageHeader.tsx`
```ts
type BreadcrumbItem = { label: string; to?: string };
type PageHeaderStat = { label: string; value: string | number; tone?: "neutral"|"success"|"warning"|"danger" };
type PageHeaderAction = { label: string; onClick: () => void; icon?: ReactNode };
type PageHeaderProps = { breadcrumb: BreadcrumbItem[]; title: string; stats?: PageHeaderStat[]; action?: PageHeaderAction };
```
Item có `to` → `<Link>`; item cuối/không `to` → text `aria-current="page"`. `stats` render 1 pill nối "•" theo `tone` (mirror pill hiện có ở `StyleListPage`). `action` dùng lại `Button` có sẵn, icon đặt trước label.

**MaterialGroupListPage** dùng:
```tsx
<PageHeader
  breadcrumb={[{ label: "Danh mục" }, { label: "Nhóm vật tư" }]}
  title="Nhóm vật tư"
  action={{ label: "Tạo nhóm vật tư mới", onClick: () => setEditing("create"), icon: <PlusIcon className="h-4 w-4" /> }}
/>
```

**StyleListPage** dùng:
```tsx
<PageHeader
  breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Mẫu Fit" }]}
  title="Mẫu Fit"
  stats={[
    { label: "mẫu", value: total },
    { label: "hoạt động", value: activeCount, tone: "success" },
    { label: "nháp", value: draftCount, tone: "warning" },
  ]}
  action={{ label: "+ Tạo Mẫu Fit Mới", onClick: () => setEditingStyle("create") }}
/>
```

### 2. Toast có variant + `useToast` hook
- `src/components/shared/Toast.tsx`: thêm `variant?: "neutral"|"success"|"error"` (mặc định `"neutral"` để không phá code cũ), style theo tông màu giống `Alert.tsx`.
- `src/hooks/useToast.ts` (mới) — hook cục bộ theo trang, **không** tạo Context/Provider toàn app (không có nhu cầu toast xuyên trang, giữ đúng convention hook cục bộ đã có như `useModal.ts`):
```ts
type ToastVariant = "success" | "error";
function useToast() {
  const [toast, setToast] = useState<{message: string; variant: ToastVariant} | null>(null);
  const showToast = (message: string, variant: ToastVariant = "success") => setToast({message, variant});
  const hideToast = () => setToast(null);
  return { toast, showToast, hideToast };
}
```
Không đổi tầng mutation (`useCreateStyle`, `useUpdateMaterialGroup`...) — mỗi page tự gọi `showToast(msg, "success"/"error")` đúng những chỗ hiện đang `setToast(...)`/hiện banner lỗi.

### 3. `ConfirmDialog` (mới, generic) — `src/components/shared/ConfirmDialog.tsx`
Thay `MaterialGroupConfirmDialog.tsx` và `DeleteConfirmDialog.tsx` (styles). Text tính sẵn ở nơi gọi (page biết rõ entity) để dialog hoàn toàn dùng lại được cho entity bất kỳ sau này:
```ts
type ConfirmDialogProps = {
  open: boolean; title: string; description: ReactNode;
  confirmLabel: string; cancelLabel?: string; // mặc định "Hủy"
  variant?: "danger" | "primary"; // danger=đỏ (xoá), primary=xanh (kích hoạt...)
  isSubmitting?: boolean; onConfirm: () => void; onClose: () => void;
};
```
Wrap `Modal` có sẵn, footer 2 nút `Button` (outline "Hủy" + variant chính).

**MaterialGroupListPage**: logic tính title/description/label hiện có trong `MaterialGroupConfirmDialog.tsx` chuyển thẳng vào `MaterialGroupListPage.tsx` (chỉ đổi chỗ, không viết lại), gọi `<ConfirmDialog ... variant={isDelete ? "danger" : "primary"} />`.

**StyleListPage**: `<ConfirmDialog title="Xóa mẫu Fit" description={...} variant="danger" .../>` thay cho `DeleteConfirmDialog`.

### 4. Mở rộng `Table` có sẵn (không tạo bảng thứ 2) — `src/components/shared/Table.tsx`
Thêm vào `TableProps<T>`: `loading?: boolean`, `loadingRowCount?: number` (mặc định 5) → render N `<tr>` skeleton thay `rows` khi `loading=true`, bỏ skeleton viết tay riêng ở từng trang. Đổi `emptyMessage?: string` → `emptyMessage?: ReactNode` để chèn được block rỗng có CTA (như Mẫu Fit hiện có) qua đúng `<td colSpan>` sẵn có.

**Thống nhất nút Thao tác theo kiểu Mẫu Fit hiện tại** (icon + chữ + viền màu theo hành động: Sửa=viền xám, Kích hoạt/Ngừng=viền xanh brand, Xóa=viền đỏ) — đây là chuẩn để Nhóm vật tư sửa theo, không phải ngược lại.

**StyleListPage**: toàn bộ `<table>` viết tay (~300 dòng) → viết thành `columns: TableColumn<Style>[]` rồi `<Table columns={...} rows={styles} loading={list.isLoading} emptyMessage={<div>...CTA...</div>} />`. Giữ nguyên style nút hiện tại của Mẫu Fit khi chuyển thành column def.

**MaterialGroupTable.tsx**: xoá cột `displayOrder` (đã xoá ở plan trước), đổi cột `actions` từ nút text phẳng sang icon+viền màu như trên.

### 5. Gộp util lỗi API — `src/lib/apiError.ts` (mới)
Dựa theo `material-group-error.ts` (đã test, dịch theo whitelist `code`, không bao giờ lộ tiếng Anh) — đã đối chiếu khớp với enum `ErrorCode` thật của BE (`Erp-BE/src/common/enums/error-code.enum.ts`: `VALIDATION_ERROR, BAD_REQUEST, RESOURCE_NOT_FOUND, CONFLICT, UNAUTHORIZED, FORBIDDEN, INTERNAL_SERVER_ERROR`):
```ts
type ApiError = { code: string; message: string };
const defaultApiErrorMessages: Record<string, string> = { /* map 7 code ở trên sang tiếng Việt */ };
function getApiError(error: unknown, fallback: string, overrides?: Record<string,string>): ApiError { ... }
function isConflictError(error: unknown): boolean { ... }
```
Xoá `material-group-error.ts` (+ test, chuyển sang `apiError.test.ts`) và `src/pages/styles/utils/getErrorMessage.ts` (hiện chỉ pass-through message thô từ BE — có nguy cơ lộ tiếng Anh, tiện sửa luôn ở đây). Trước khi cắt qua, kiểm tra nhanh 1 response lỗi thật từ `/styles` (409/404) để chắc field `code` trả về đúng như Nhóm vật tư.

## Áp dụng vào Nhóm vật tư — tóm tắt các file cần sửa
- Xoá `MaterialGroupPageHeader.tsx`, dùng `PageHeader`.
- Xoá `MaterialGroupConfirmDialog.tsx` (+ test), dùng `ConfirmDialog`.
- `MaterialGroupListPage.tsx`: `useState("")` → `useToast()`; bỏ skeleton viết tay dùng `loading` prop của Table.
- `MaterialGroupForm.tsx`: đổi type `serverError` từ `MaterialGroupError` sang `ApiError`.

## Áp dụng vào Mẫu Fit — tóm tắt các file cần sửa
- `StyleListPage.tsx`: header + table + skeleton + empty state như trên; `actionError` → `useToast()`.
- `StyleDetailPage.tsx`: `statusError` (banner lặp lại) → `useToast()`.
- Xoá `DeleteConfirmDialog.tsx`, dùng `ConfirmDialog`.
- Xoá `getErrorMessage.ts`, dùng `apiError.ts`.
- View Grid (card), toolbar filter, phân trang giữ nguyên — không thuộc phạm vi.

## Test cần cập nhật
`MaterialGroupTable.test.tsx` (bớt cột, đổi assertion nút), `MaterialGroupConfirmDialog.test.tsx` → viết lại thành `ConfirmDialog.test.tsx` dùng chung, `material-group-error.test.ts` → `apiError.test.ts`, `StyleListPage.test.tsx` (DOM bảng đổi sang `Table`). Thêm mới: `useToast.test.ts`, test `loading`/`emptyMessage` ReactNode cho `Table.tsx`, `PageHeader.test.tsx`.

## Thứ tự thực hiện đề xuất
1. Tạo 5 mảnh dùng chung (chưa đụng 2 module) — tự test riêng.
2. Áp dụng vào Nhóm vật tư.
3. Áp dụng vào Mẫu Fit.
4. Chạy lại toàn bộ `tsc`, `eslint`, `vitest`, `npm run build`.
5. Mở 2 trang so sánh trực quan: cùng breadcrumb/tiêu đề, cùng bảng/nút thao tác, cùng toast thành công/thất bại, cùng dialog xác nhận xoá.
