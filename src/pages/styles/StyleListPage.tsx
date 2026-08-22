import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Style, StyleStatus, StyleQueryFilter } from "@/types/style";
import { stylesApi } from "@/features/styles/api/stylesApi";
import { StyleFormModal } from "./StyleFormModal";
import { StyleImagePlaceholder } from "./components/StyleImagePlaceholder";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

type ViewMode = "table" | "grid";

export default function StyleListPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast / Action error state
  const [actionError, setActionError] = useState<string | null>(null);

  // Status toggle in-progress ID
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // View Mode state
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filters state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<StyleStatus | "">("");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  // Delete Confirm Dialog state
  const [styleToDelete, setStyleToDelete] = useState<Style | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStyles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filter: StyleQueryFilter = {
        search: search.trim() || undefined,
        category: category.trim() || undefined,
        status: status !== "" ? (status as StyleStatus) : undefined,
        page,
        limit,
      };
      const res = await stylesApi.getStyles(filter);
      setStyles(res?.data ?? []);
      setTotal(res?.meta?.total ?? 0);
      setTotalPages(res?.meta?.totalPages ?? 1);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách mẫu Fit. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, [search, category, status, page, limit]);

  useEffect(() => {
    fetchStyles();
  }, [fetchStyles]);

  const handleOpenCreateModal = () => {
    setEditingStyle(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (style: Style) => {
    setEditingStyle(style);
    setIsModalOpen(true);
  };

  const handleRequestDelete = (style: Style) => {
    setStyleToDelete(style);
  };

  const handleConfirmDelete = async () => {
    if (!styleToDelete) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await stylesApi.deleteStyle(styleToDelete.id);
      setStyleToDelete(null);
      fetchStyles();
    } catch (err: any) {
      setActionError(err.response?.data?.message || "Xóa mẫu Fit thất bại. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle switch status handler (Draft <-> Active)
  const handleToggleStatus = async (style: Style) => {
    const newStatus: StyleStatus = style.status === "active" ? "draft" : "active";
    try {
      setTogglingId(style.id);
      setActionError(null);
      await stylesApi.updateStyle(style.id, { status: newStatus });
      setStyles((prev) =>
        prev.map((item) => (item.id === style.id ? { ...item, status: newStatus } : item))
      );
    } catch (err: any) {
      setActionError(err.response?.data?.message || "Đổi trạng thái thất bại.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setPage(1);
  };

  const isFiltering = search.trim() !== "" || category.trim() !== "" || status !== "";

  // Stat counts for minimal header display
  const activeCount = styles.filter((s) => s.status === "active").length;
  const draftCount = styles.filter((s) => s.status !== "active").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-900 dark:text-white">Mẫu Fit</span>
          </nav>

          {/* Title & Small Inline Summary */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Mẫu Fit
            </h1>
            {/* Small Compact Stat Badge */}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/80 px-2.5 py-1 rounded-full border border-gray-200/80 dark:border-gray-700/80">
              <span>{total} mẫu</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">{activeCount} hoạt động</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400">{draftCount} nháp</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            + Tạo Mẫu Fit Mới
          </button>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="ml-2 font-bold text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Enterprise Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left Controls: Search & Category */}
        <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
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
            placeholder="Nhóm mẫu..."
            className="h-10 w-36 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-white transition-colors"
          />

          {isFiltering && (
            <button
              onClick={handleClearFilters}
              className="h-10 px-3 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Right Controls: Status Filter (Draft vs Active) & View Switcher */}
        <div className="flex items-center gap-3">
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
                      ? "bg-white text-blue-600 shadow-xs dark:bg-gray-800 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-800 dark:bg-gray-900">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <p className="font-semibold">⚠️ Không thể tải dữ liệu</p>
          <p className="mt-0.5">{error}</p>
          <button
            onClick={fetchStyles}
            className="mt-2.5 rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !error && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/60" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && styles.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Không tìm thấy Mẫu Fit nào
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Chưa có dữ liệu nào khớp với từ khóa hoặc bộ lọc của bạn.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Tạo Mẫu Fit Mới
          </button>
        </div>
      )}

      {/* Data Workspace: Table View or Grid View */}
      {!isLoading && !error && styles.length > 0 && (
        <>
          {viewMode === "table" ? (
            /* LINEAR / STRIPE CLEAR READABLE ENTERPRISE TABLE VIEW */
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700 dark:text-gray-200">
                  <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-400">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Mã mẫu</th>
                      <th className="px-5 py-3.5 font-semibold">Tên mẫu</th>
                      <th className="px-5 py-3.5 font-semibold">Nhóm</th>
                      <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                      <th className="px-5 py-3.5 font-semibold">Ngày tạo</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {styles.map((style) => (
                      <tr
                        key={style.id}
                        className="group h-16 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {/* Mã mẫu */}
                        <td className="px-5 py-4">
                          <Link
                            to={`/styles/${style.id}`}
                            className="font-mono text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {style.styleCode}
                          </Link>
                        </td>

                        {/* Tên mẫu */}
                        <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {style.styleName}
                        </td>

                        {/* Nhóm mẫu */}
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {style.category || "—"}
                        </td>

                        {/* Trạng thái - Nút Cần Gạt (Toggle Switch) */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(style)}
                              disabled={togglingId === style.id}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                style.status === "active" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
                              } ${togglingId === style.id ? "opacity-50" : ""}`}
                              title={
                                style.status === "active"
                                  ? "Đang Hoạt động (Bấm để chuyển thành Nháp)"
                                  : "Đang Nháp (Bấm để chuyển thành Hoạt động)"
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                  style.status === "active" ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-medium ${
                                style.status === "active"
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {style.status === "active" ? "Hoạt động" : "Nháp"}
                            </span>
                          </div>
                        </td>

                        {/* Ngày tạo */}
                        <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(style.createdAt).toLocaleDateString("vi-VN")}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right space-x-3">
                          <Link
                            to={`/styles/${style.id}`}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            Xem
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(style)}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleRequestDelete(style)}
                            className="text-xs font-medium text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* PRODUCT CATALOG GRID VIEW WITH TOGGLE SWITCH */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {styles.map((style) => (
                <div
                  key={style.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200/80 bg-white p-3.5 transition-all duration-200 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative overflow-hidden rounded-lg">
                      <StyleImagePlaceholder styleCode={style.styleCode} className="transition-transform duration-200 group-hover:scale-[1.02]" />
                    </div>

                    {/* Metadata */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {style.styleCode}
                        </span>
                        {/* Toggle Switch */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(style)}
                            disabled={togglingId === style.id}
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
                          <span className="text-[11px] font-medium text-gray-500">
                            {style.status === "active" ? "Active" : "Draft"}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                        {style.styleName}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {style.category || "Chưa phân nhóm"}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-gray-800">
                    <span className="text-[11px] text-gray-400">
                      {new Date(style.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <Link
                        to={`/styles/${style.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Chi tiết
                      </Link>
                      <button
                        onClick={() => handleOpenEditModal(style)}
                        className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleRequestDelete(style)}
                        className="text-xs font-medium text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continuous Pagination */}
          <div className="flex items-center justify-between py-2 text-xs text-gray-500">
            <span>
              Hiển thị <strong className="font-medium text-gray-900 dark:text-white">{styles.length}</strong> / <strong className="font-medium text-gray-900 dark:text-white">{total}</strong> mẫu Fit
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Trước
              </button>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal Form */}
      <StyleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStyles}
        styleToEdit={editingStyle}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={!!styleToDelete}
        styleCode={styleToDelete?.styleCode}
        styleName={styleToDelete?.styleName}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setStyleToDelete(null)}
      />
    </div>
  );
}
