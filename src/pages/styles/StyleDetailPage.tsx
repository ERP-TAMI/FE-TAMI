import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type { Style, StyleStatus } from "@/types/style";
import { stylesApi } from "@/features/styles/api/stylesApi";
import { StyleStatusBadge } from "./StyleStatusBadge";
import { StyleFormModal } from "./StyleFormModal";

export default function StyleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [style, setStyle] = useState<Style | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchStyleDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await stylesApi.getStyleById(id);
      setStyle(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải thông tin mẫu Fit.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStyleDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: StyleStatus) => {
    if (!style) return;
    try {
      setIsUpdatingStatus(true);
      const updated = await stylesApi.updateStyle(style.id, { status: newStatus });
      setStyle(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || "Cập nhật trạng thái thất bại");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-800"></div>
          <div className="h-40 w-full rounded bg-gray-200 dark:bg-gray-800"></div>
        </div>
      </div>
    );
  }

  if (error || !style) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <h3 className="text-lg font-bold">Lỗi không tìm thấy dữ liệu</h3>
          <p className="mt-2 text-sm">{error || "Mẫu Fit không tồn tại."}</p>
          <button
            onClick={() => navigate("/styles")}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/styles"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Danh sách mẫu Fit
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {style.styleCode}
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {style.styleName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Detail Content Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Main Info */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Mã mẫu (Style Code)
              </label>
              <p className="mt-1 text-lg font-mono font-bold text-gray-900 dark:text-white">
                {style.styleCode}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tên mẫu Fit
              </label>
              <p className="mt-1 text-base text-gray-800 dark:text-gray-200">
                {style.styleName}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Nhóm mẫu (Category)
              </label>
              <p className="mt-1 text-base text-gray-800 dark:text-gray-200">
                {style.category || "— chưa phân nhóm —"}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Trạng thái hiện tại
              </label>
              <div className="mt-1 flex items-center gap-3">
                <StyleStatusBadge status={style.status} />
              </div>
            </div>
          </div>

          {/* Additional Meta Info & Status Transitions */}
          <div className="space-y-4 border-t border-gray-100 pt-4 md:border-t-0 md:border-l md:border-gray-100 md:pl-6 md:pt-0 dark:border-gray-800">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Mô tả mẫu Fit
              </label>
              <p className="mt-1 text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                {style.description || "Không có mô tả."}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Ảnh mẫu (Base Image Version ID)
              </label>
              <p className="mt-1 text-sm font-mono text-gray-600 dark:text-gray-400">
                {style.baseImageVersionId || "Chưa có ảnh mẫu đính kèm"}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Cập nhật nhanh trạng thái
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={style.status === "draft" || isUpdatingStatus}
                  onClick={() => handleStatusChange("draft")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                    style.status === "draft"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  DRAFT
                </button>
                <button
                  disabled={style.status === "approved" || isUpdatingStatus}
                  onClick={() => handleStatusChange("approved")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                    style.status === "approved"
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  APPROVED
                </button>
                <button
                  disabled={style.status === "active" || isUpdatingStatus}
                  onClick={() => handleStatusChange("active")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                    style.status === "active"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  ACTIVE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StyleFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchStyleDetail}
        styleToEdit={style}
      />
    </div>
  );
}
