import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Style, StyleStatus, StyleQueryFilter } from "@/types/style";
import { stylesApi } from "@/features/styles/api/stylesApi";
import { StyleStatusBadge } from "./StyleStatusBadge";
import { StyleFormModal } from "./StyleFormModal";
import { StyleStatStrip } from "./components/StyleStatStrip";
import { StyleImagePlaceholder } from "./components/StyleImagePlaceholder";

type ViewMode = "table" | "grid";

export default function StyleListPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = async (style: Style) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu Fit "${style.styleCode}"?`)) return;
    try {
      await stylesApi.deleteStyle(style.id);
      fetchStyles();
    } catch (err: any) {
      alert(err.response?.data?.message || "Xóa mẫu Fit thất bại.");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setPage(1);
  };

  const isFiltering = search.trim() !== "" || category.trim() !== "" || status !== "";

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
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Mẫu Fit
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Quản lý và theo dõi các mẫu fit trong hệ thống
          </p>
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

      {/* Stat Summary Strip */}
      <StyleStatStrip styles={styles} totalCount={total} />

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

        {/* Right Controls: Status Filter & View Switcher */}
        <div className="flex items-center gap-3">
          {/* Status Segmented Filter */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 dark:border-gray-800 dark:bg-gray-900">
            {(["", "draft", "approved", "active"] as const).map((st) => {
              const label = st === "" ? "Tất cả" : st.charAt(0).toUpperCase() + st.slice(1);
              const isSelected = status === st;
              return (
                <button
                  key={st}
                  onClick={() => {
                    setStatus(st as StyleStatus | "");
                    setPage(1);
                  }}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-white text-blue-600 shadow-xs dark:bg-gray-800 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {label}
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
            <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/60" />
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
            /* LINEAR / STRIPE MODERN TABLE VIEW */
            <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                  <thead className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Mã mẫu</th>
                      <th className="px-4 py-3 font-medium">Tên mẫu</th>
                      <th className="px-4 py-3 font-medium">Nhóm</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                      <th className="px-4 py-3 font-medium">Ngày tạo</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {styles.map((style) => (
                      <tr
                        key={style.id}
                        className="group h-14 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            to={`/styles/${style.id}`}
                            className="font-mono text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {style.styleCode}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {style.styleName}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {style.category || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StyleStatusBadge status={style.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500">
                          {new Date(style.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-3 text-right space-x-3">
                          <Link
                            to={`/styles/${style.id}`}
                            className="text-xs font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
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
                            onClick={() => handleDelete(style)}
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
            /* PRODUCT CATALOG GRID VIEW */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {styles.map((style) => (
                <div
                  key={style.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200/80 bg-white p-3 transition-all duration-200 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative overflow-hidden rounded-lg">
                      <StyleImagePlaceholder styleCode={style.styleCode} className="transition-transform duration-200 group-hover:scale-[1.02]" />
                    </div>

                    {/* Metadata */}
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-medium text-blue-600 dark:text-blue-400">
                          {style.styleCode}
                        </span>
                        <StyleStatusBadge status={style.status} showDot={true} />
                      </div>
                      <h4 className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1">
                        {style.styleName}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {style.category || "Chưa phân nhóm"}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-gray-800">
                    <span className="text-[11px] text-gray-400">
                      {new Date(style.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <div className="flex items-center gap-2">
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
    </div>
  );
}
