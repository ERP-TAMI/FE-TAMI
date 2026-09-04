import { useState } from "react";
import { Link } from "react-router-dom";
import type { Style, StyleStatus, CreateStylePayload } from "@/types/style";
import {
  useStyles,
  useCreateStyle,
  useUpdateStyle,
  useDeleteStyle,
} from "@/hooks/useStyles";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog, PageHeader, Pagination, Toast } from "@/components/shared";
import { StyleFormModal } from "@/components/features/styles/StyleFormModal";
import { StyleImagePlaceholder } from "@/components/features/styles/StyleImagePlaceholder";
import { StyleStatusBadge } from "@/components/features/styles/StyleStatusBadge";
import { StyleTable } from "@/components/features/styles/StyleTable";
import { getApiError, isConflictError } from "@/lib/apiError";
import { TableIcon, GridIcon, EyeIcon, PencilIcon } from "@/icons";

type ViewMode = "table" | "grid";

const emptyStyles: Style[] = [];

export default function StyleListPage() {
  const { toast, showToast, hideToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<StyleStatus | "">("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal / dialog state
  const [editingStyle, setEditingStyle] = useState<Style | "create" | undefined>();
  const [styleToDelete, setStyleToDelete] = useState<Style | undefined>();

  const filter = {
    search: search.trim() || undefined,
    category: category.trim() || undefined,
    status: status !== "" ? status : undefined,
    page,
    limit,
  };

  const list = useStyles(filter);
  const create = useCreateStyle();
  const update = useUpdateStyle();
  const statusUpdate = useUpdateStyle();
  const remove = useDeleteStyle();

  const styles = list.data?.data ?? emptyStyles;
  const total = list.data?.meta.total ?? 0;
  const totalPages = list.data?.meta.totalPages ?? 1;
  const formError = create.error ?? update.error;
  const serverError = formError
    ? getApiError(formError, "Có lỗi xảy ra khi lưu thông tin mẫu Fit.").message
    : null;
  const hasCodeConflict = isConflictError(formError);

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setPage(1);
  };

  const isFiltering = search.trim() !== "" || category.trim() !== "" || status !== "";

  const activeCount = styles.filter((s) => s.status === "active").length;
  const draftCount = styles.filter((s) => s.status === "draft").length;

  const closeForm = () => setEditingStyle(undefined);

  const saveForm = async (payload: CreateStylePayload) => {
    try {
      if (editingStyle === "create") await create.mutateAsync(payload);
      else if (editingStyle) await update.mutateAsync({ id: editingStyle.id, payload });
      showToast(editingStyle === "create" ? "Đã tạo mẫu Fit." : "Đã cập nhật mẫu Fit.");
      closeForm();
    } catch {
      // Lỗi đã hiển thị trong form qua create.error/update.error.
    }
  };

  const confirmDelete = async () => {
    if (!styleToDelete) return;
    try {
      await remove.mutateAsync(styleToDelete.id);
      showToast("Đã xóa mẫu Fit.");
      setStyleToDelete(undefined);
    } catch (err: unknown) {
      showToast(getApiError(err, "Xóa mẫu Fit thất bại. Vui lòng thử lại.").message, "error");
    }
  };

  const toggleStatus = async (style: Style) => {
    const nextStatus: StyleStatus = style.status === "active" ? "draft" : "active";
    try {
      await statusUpdate.mutateAsync({ id: style.id, payload: { status: nextStatus } });
      showToast(nextStatus === "active" ? "Đã kích hoạt mẫu Fit." : "Đã chuyển mẫu Fit về nháp.");
    } catch (err: unknown) {
      showToast(getApiError(err, "Đổi trạng thái thất bại.").message, "error");
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Enterprise Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo Mã mẫu hoặc Tên mẫu..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Input */}
          <input
            type="text"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            placeholder="Dòng sản phẩm..."
            className="h-10 w-36 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white transition-colors"
          />

          {/* Status Segmented Filter */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-800 dark:bg-gray-900">
            {[
              { key: "", label: "Tất cả" },
              { key: "draft", label: "Nháp" },
              { key: "active", label: "Hoạt động" },
            ].map((st) => {
              const isSelected = status === st.key;
              return (
                <button
                  key={st.key}
                  onClick={() => {
                    setStatus(st.key as StyleStatus | "");
                    setPage(1);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-white text-blue-600 shadow-xs dark:bg-gray-800 dark:text-blue-400 font-semibold"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {isFiltering && (
            <button
              onClick={handleClearFilters}
              className="h-10 px-3 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white font-semibold"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
              title="Xem dạng Bảng (Table)"
            >
              <TableIcon className="h-4 w-4" />
              <span>Bảng</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white font-semibold"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
              title="Xem dạng Thẻ (Grid)"
            >
              <GridIcon className="h-4 w-4" />
              <span>Thẻ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {list.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <p className="font-semibold">⚠️ Không thể tải dữ liệu</p>
          <p className="mt-0.5">
            {getApiError(list.error, "Không thể tải danh sách mẫu Fit. Vui lòng thử lại.").message}
          </p>
          <button
            onClick={() => void list.refetch()}
            className="mt-2.5 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {list.isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/60" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!list.isLoading && !list.isError && styles.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Không tìm thấy Mẫu Fit nào
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Chưa có dữ liệu nào khớp với từ khóa hoặc bộ lọc của bạn.
          </p>
          <button
            onClick={() => setEditingStyle("create")}
            className="mt-4 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Tạo Mẫu Fit Mới
          </button>
        </div>
      )}

      {/* Data Workspace: Table View or Grid View */}
      {!list.isLoading && !list.isError && styles.length > 0 && (
        <>
          {viewMode === "table" ? (
            <StyleTable
              styles={styles}
              togglingId={statusUpdate.isPending ? statusUpdate.variables?.id : undefined}
              onToggleStatus={(style) => void toggleStatus(style)}
              onEdit={setEditingStyle}
              onDelete={setStyleToDelete}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {styles.map((style) => {
                const isToggling = statusUpdate.isPending && statusUpdate.variables?.id === style.id;
                return (
                  <div
                    key={style.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200/80 bg-white p-3.5 transition-all duration-200 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                  >
                    <div>
                      <div className="relative overflow-hidden rounded-lg">
                        <StyleImagePlaceholder className="transition-transform duration-200 group-hover:scale-[1.02]" />
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="min-w-0 flex-1 truncate font-mono text-sm font-semibold text-blue-600 dark:text-blue-400"
                            title={style.styleCode}
                          >
                            {style.styleCode}
                          </span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => void toggleStatus(style)}
                              disabled={isToggling}
                              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                style.status === "active" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                  style.status === "active" ? "translate-x-3" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <StyleStatusBadge status={style.status} showDot={false} />
                          </div>
                        </div>
                        <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white" title={style.styleName}>
                          {style.styleName}
                        </h4>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {style.category || "Chưa phân nhóm"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-gray-800">
                      <span className="text-[11px] text-gray-400">
                        {new Date(style.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/styles/${style.id}/detail`}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50/60 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          <EyeIcon className="h-3 w-3" />
                          <span>Xem</span>
                        </Link>
                        <button
                          onClick={() => setEditingStyle(style)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                          <PencilIcon className="h-3 w-3" />
                          <span>Sửa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination
            page={page}
            pageSize={limit}
            totalItems={total}
            totalPages={totalPages}
            itemLabel="mẫu Fit"
            onPageChange={setPage}
          />
        </>
      )}

      {/* Modal Form */}
      {editingStyle && (
        <StyleFormModal
          isOpen
          styleToEdit={editingStyle === "create" ? undefined : editingStyle}
          isSubmitting={create.isPending || update.isPending}
          serverError={serverError}
          hasCodeConflict={hasCodeConflict}
          onClose={closeForm}
          onSubmit={(payload) => void saveForm(payload)}
        />
      )}

      {/* Delete Confirmation */}
      {styleToDelete && (
        <ConfirmDialog
          open
          title="Xóa mẫu Fit"
          description={
            <>
              Bạn có chắc chắn muốn xóa mẫu Fit{" "}
              <strong className="text-brand-600 dark:text-brand-400 font-mono break-all">
                {styleToDelete.styleCode || styleToDelete.styleName}
              </strong>{" "}
              không? Hành động này không thể hoàn tác.
            </>
          }
          confirmLabel="Xóa Mẫu Fit"
          variant="danger"
          isSubmitting={remove.isPending}
          onConfirm={() => void confirmDelete()}
          onClose={() => setStyleToDelete(undefined)}
        />
      )}
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        closeLabel="Đóng thông báo"
        onClose={hideToast}
      />
    </div>
  );
}
