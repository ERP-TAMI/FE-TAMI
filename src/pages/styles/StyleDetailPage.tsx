import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import type { Style, StyleStatus } from "@/types/style";
import { stylesApi } from "@/features/styles/api/stylesApi";
import { StyleStatusBadge } from "./StyleStatusBadge";
import { StyleFormModal } from "./StyleFormModal";
import { StyleImagePlaceholder } from "./components/StyleImagePlaceholder";

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
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-48 w-full rounded-xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    );
  }

  if (error || !style) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        <h3 className="font-semibold text-sm">Không tìm thấy mẫu Fit</h3>
        <p className="mt-1">{error || "Mẫu Fit không tồn tại."}</p>
        <button
          onClick={() => navigate("/styles")}
          className="mt-4 rounded-md bg-red-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const workflowSteps: { key: StyleStatus; label: string }[] = [
    { key: "draft", label: "Draft" },
    { key: "approved", label: "Approved" },
    { key: "active", label: "Active" },
  ];

  const currentStepIndex = workflowSteps.findIndex((s) => s.key === style.status);

  return (
    <div className="space-y-6">
      {/* Minimal Breadcrumb & Page Title */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
          <Link to="/dashboard" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link to="/styles" className="hover:text-gray-900 dark:hover:text-white transition-colors">
            Mẫu Fit
          </Link>
          <span>/</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {style.styleCode}
          </span>
        </nav>

        {/* Style Identity Header */}
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 shrink-0">
              <StyleImagePlaceholder styleCode={style.styleCode} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {style.styleName}
                </h1>
                <StyleStatusBadge status={style.status} />
              </div>
              <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                {style.styleCode} {style.category ? `• ${style.category}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>

      {/* Status Workflow Progress Step */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
          Status Workflow
        </span>
        <div className="mt-4 flex items-center justify-between max-w-lg">
          {workflowSteps.map((step, idx) => {
            const isActive = style.status === step.key;
            const isCompleted = idx <= currentStepIndex;

            return (
              <div key={step.key} className="flex flex-1 items-center">
                {/* Step Node */}
                <button
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusChange(step.key)}
                  className={`group relative flex items-center gap-2 transition-colors ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : isCompleted
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      isActive
                        ? "bg-blue-600 ring-4 ring-blue-500/20"
                        : isCompleted
                          ? "bg-gray-900 dark:bg-white"
                          : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  />
                  <span className="text-xs">{step.label}</span>
                </button>

                {/* Connector Line */}
                {idx < workflowSteps.length - 1 && (
                  <div
                    className={`mx-3 h-[1px] flex-1 transition-colors ${
                      idx < currentStepIndex
                        ? "bg-gray-900 dark:bg-white"
                        : "bg-gray-200 dark:bg-gray-800"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Information - Description List Style */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-6">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Thông tin mẫu fit
          </h3>
          <dl className="mt-3 divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            <div className="flex py-2.5">
              <dt className="w-1/3 text-gray-500 dark:text-gray-400">Mã mẫu</dt>
              <dd className="w-2/3 font-mono font-medium text-gray-900 dark:text-white">
                {style.styleCode}
              </dd>
            </div>
            <div className="flex py-2.5">
              <dt className="w-1/3 text-gray-500 dark:text-gray-400">Tên mẫu</dt>
              <dd className="w-2/3 font-medium text-gray-900 dark:text-white">
                {style.styleName}
              </dd>
            </div>
            <div className="flex py-2.5">
              <dt className="w-1/3 text-gray-500 dark:text-gray-400">Nhóm mẫu</dt>
              <dd className="w-2/3 text-gray-900 dark:text-white">
                {style.category || "—"}
              </dd>
            </div>
            <div className="flex py-2.5">
              <dt className="w-1/3 text-gray-500 dark:text-gray-400">Trạng thái</dt>
              <dd className="w-2/3">
                <StyleStatusBadge status={style.status} />
              </dd>
            </div>
            <div className="flex py-2.5">
              <dt className="w-1/3 text-gray-500 dark:text-gray-400">Mô tả đặc điểm</dt>
              <dd className="w-2/3 text-gray-900 dark:text-white whitespace-pre-wrap">
                {style.description || "Chưa có mô tả chi tiết."}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 border-t border-gray-100 pt-5 dark:border-gray-800">
            Thông tin hệ thống
          </h3>
          <dl className="mt-3 divide-y divide-gray-100 dark:divide-gray-800 text-xs">
            <div className="flex py-2.5">
              <dt className="w-1/3 text-gray-500 dark:text-gray-400">Thời gian tạo</dt>
              <dd className="w-2/3 text-gray-900 dark:text-white">
                {new Date(style.createdAt).toLocaleString("vi-VN")}
              </dd>
            </div>
            <div className="flex py-2.5">
              <dt className="w-1/3 text-gray-500 dark:text-gray-400">Cập nhật gần nhất</dt>
              <dd className="w-2/3 text-gray-900 dark:text-white">
                {new Date(style.updatedAt).toLocaleString("vi-VN")}
              </dd>
            </div>
            <div className="flex py-2.5">
              <dt className="w-1/3 text-gray-500 dark:text-gray-400">Row Version</dt>
              <dd className="w-2/3 font-mono text-gray-900 dark:text-white">
                v{style.rowVersion}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Edit Form Modal */}
      <StyleFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchStyleDetail}
        styleToEdit={style}
      />
    </div>
  );
}
