import { useState, useEffect, useRef, useCallback } from "react";
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

  // Image Upload / Paste state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStyleDetail = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await stylesApi.getStyleById(id);
      setStyle(data);
      if (data.baseImageVersionId) {
        setImageUrl(data.baseImageVersionId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải thông tin mẫu Fit.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStyleDetail();
  }, [id]);

  // Handle Clipboard Paste (Ctrl+V) for Image
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const localUrl = URL.createObjectURL(file);
          setImageUrl(localUrl);
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleToggleStatus = async () => {
    if (!style) return;
    const newStatus: StyleStatus = style.status === "active" ? "draft" : "active";
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
        <div className="h-96 w-full rounded-xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    );
  }

  if (error || !style) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        <h3 className="font-semibold text-base">Không tìm thấy mẫu Fit</h3>
        <p className="mt-1">{error || "Mẫu Fit không tồn tại."}</p>
        <button
          onClick={() => navigate("/styles")}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Minimal Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
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

      {/* Product Style Record Layout (Left 5 Cols Image, Right 7 Cols Info) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Product Photo Visual Focus (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800">
                <img
                  src={imageUrl}
                  alt={style.styleName}
                  className="aspect-[4/5] w-full object-contain"
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-white backdrop-blur-xs dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-900 transition-colors"
                  >
                    Thay ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-white backdrop-blur-xs dark:bg-gray-900/90 dark:text-red-400 dark:hover:bg-gray-900 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30"
                    : "border-gray-200 hover:border-gray-300 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40"
                }`}
              >
                <StyleImagePlaceholder styleCode={style.styleCode} className="h-32 w-32 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Tải ảnh mẫu hoặc Dán trực tiếp (Ctrl+V)
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Kéo thả file ảnh hoặc bấm để chọn
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Right Column: Style Information & Controls (7 cols) - Enlarged & Clear Typography */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Identity Block */}
          <div className="space-y-3 pb-6 border-b border-gray-200/80 dark:border-gray-800">
            {/* Title & Single Primary Status Badge */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {style.styleName}
                  </h1>
                  <StyleStatusBadge status={style.status} />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                    {style.styleCode}
                  </span>
                  {style.category && (
                    <>
                      <span className="text-gray-300 dark:text-gray-700">•</span>
                      <span className="text-base font-medium text-gray-600 dark:text-gray-300">
                        {style.category}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Top Actions: Single Status Toggle & Edit Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isUpdatingStatus}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    style.status === "active" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                  title={style.status === "active" ? "Đang Hoạt động (Bấm để chuyển về Nháp)" : "Đang Nháp (Bấm để kích hoạt)"}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      style.status === "active" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>

                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors shadow-xs"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>

          {/* Details Section with Enlarged Clear Typography */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Thông tin chi tiết mẫu fit
            </h3>
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <div className="flex py-4">
                <dt className="w-1/3 text-sm font-semibold text-gray-500 dark:text-gray-400">Mã mẫu Fit</dt>
                <dd className="w-2/3 font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                  {style.styleCode}
                </dd>
              </div>
              <div className="flex py-4">
                <dt className="w-1/3 text-sm font-semibold text-gray-500 dark:text-gray-400">Tên mẫu Fit</dt>
                <dd className="w-2/3 text-base font-semibold text-gray-900 dark:text-white">
                  {style.styleName}
                </dd>
              </div>
              <div className="flex py-4">
                <dt className="w-1/3 text-sm font-semibold text-gray-500 dark:text-gray-400">Dòng sản phẩm</dt>
                <dd className="w-2/3 text-base font-medium text-gray-900 dark:text-white">
                  {style.category || "—"}
                </dd>
              </div>
              <div className="flex py-4">
                <dt className="w-1/3 text-sm font-semibold text-gray-500 dark:text-gray-400">Mô tả đặc điểm</dt>
                <dd className="w-2/3 text-base font-medium text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                  {style.description || "Chưa có mô tả chi tiết."}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quiet Technical Metadata Footer */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500 font-medium">
              <span>Tạo lúc: {new Date(style.createdAt).toLocaleString("vi-VN")}</span>
              <span>•</span>
              <span>Cập nhật: {new Date(style.updatedAt).toLocaleString("vi-VN")}</span>
              <span>•</span>
              <span className="font-mono">Row Version: v{style.rowVersion}</span>
            </div>
          </div>
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
