import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import type { Style, StyleStatus, StyleQueryFilter } from "@/types/style";
import { stylesApi } from "@/features/styles/api/stylesApi";
import { StyleStatusBadge } from "./StyleStatusBadge";
import { StyleFormModal } from "./StyleFormModal";

export default function StyleListPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setStyles(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
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

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Danh sách Mẫu Fit (Styles)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Quản lý và thiết lập danh mục Mẫu Fit độc lập với Đơn hàng PO.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition"
        >
          + Tạo Mẫu Fit Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search Box */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
              Tìm kiếm mẫu Fit
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Nhập mã (FIT-...) hoặc tên mẫu..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
              Nhóm mẫu (Category)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              placeholder="Lọc theo nhóm..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StyleStatus | "");
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Draft (Nháp)</option>
              <option value="approved">Approved (Đã duyệt)</option>
              <option value="active">Active (Hoạt động)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Error State */}
        {error && (
          <div className="p-6 text-center">
            <div className="mx-auto max-w-md rounded-xl bg-red-50 p-4 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              <p className="font-semibold">⚠️ Lỗi tải dữ liệu</p>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={fetchStyles}
                className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !error && (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex h-12 w-full animate-pulse items-center rounded-lg bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && styles.length === 0 && (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-2xl">
              👕
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              Không tìm thấy Mẫu Fit nào
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Chưa có dữ liệu phù hợp với bộ lọc tìm kiếm của bạn.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Tạo Mẫu Fit Mới
            </button>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !error && styles.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3.5">Mã mẫu Fit</th>
                    <th className="px-6 py-3.5">Tên mẫu Fit</th>
                    <th className="px-6 py-3.5">Nhóm mẫu</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5">Ngày khởi tạo</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {styles.map((style) => (
                    <tr
                      key={style.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-gray-900 dark:text-white">
                        <Link
                          to={`/styles/${style.id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {style.styleCode}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">
                        {style.styleName}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {style.category || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <StyleStatusBadge status={style.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(style.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          to={`/styles/${style.id}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          Chi tiết
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(style)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(style)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs text-gray-500">
                Hiển thị <strong>{styles.length}</strong> / <strong>{total}</strong> mẫu Fit
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
                >
                  ← Trang trước
                </button>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
                >
                  Trang sau →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <StyleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchStyles}
        styleToEdit={editingStyle}
      />
    </div>
  );
}
