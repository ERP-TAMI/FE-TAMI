import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { StyleStatus } from "@/types/style";
import { useStyle, useUpdateStyle } from "@/hooks/useStyles";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/shared";
import { StyleFormModal } from "@/components/features/styles/StyleFormModal";
import { StyleHeader } from "@/components/features/styles/StyleHeader";
import { StyleTabs } from "@/components/features/styles/StyleTabs";
import { GeneralTab } from "@/components/features/styles/GeneralTab";
import { StyleProductionDocTab } from "@/components/features/production-docs/StyleProductionDocTab";
import { getApiError, isConflictError } from "@/lib/apiError";

export default function StyleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab: "general" | "production_doc" = location.pathname.endsWith("/production-doc")
    ? "production_doc"
    : "general";

  useEffect(() => {
    if (id && !location.pathname.endsWith("/detail") && !location.pathname.endsWith("/production-doc")) {
      navigate(`/styles/${id}/detail`, { replace: true });
    }
  }, [id, location.pathname, navigate]);

  const handleTabChange = (tab: "general" | "production_doc") => {
    if (!id) return;
    if (tab === "production_doc") {
      navigate(`/styles/${id}/production-doc`);
    } else {
      navigate(`/styles/${id}/detail`);
    }
  };

  const detail = useStyle(id);
  const style = detail.data;
  const update = useUpdateStyle();
  const statusUpdate = useUpdateStyle();
  const uploadImage = useUploadImage();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (style?.baseImageVersionId) setImageUrl(style.baseImageVersionId);
  }, [style?.baseImageVersionId]);

  const handleUploadAndSaveImage = useCallback(
    async (file: File) => {
      if (!style) return;
      try {
        const res = await uploadImage.mutateAsync(file);
        setImageUrl(res.url);
        await update.mutateAsync({
          id: style.id,
          payload: { baseImageVersionId: res.url },
        });
        showToast("Đã tải và lưu ảnh mẫu Fit thành công.");
      } catch (err) {
        showToast(getApiError(err, "Tải ảnh mẫu thất bại.").message, "error");
      }
    },
    [style, uploadImage, update, showToast],
  );

  const clearLocalImage = useCallback(async () => {
    if (!style) return;
    try {
      setImageUrl(null);
      await update.mutateAsync({
        id: style.id,
        payload: { baseImageVersionId: null },
      });
      showToast("Đã xóa ảnh mẫu Fit.");
    } catch (err) {
      showToast(getApiError(err, "Xóa ảnh mẫu thất bại.").message, "error");
    }
  }, [style, update, showToast]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) void handleUploadAndSaveImage(file);
        }
      }
    },
    [handleUploadAndSaveImage],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleUploadAndSaveImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) void handleUploadAndSaveImage(file);
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
    const nextStatus: StyleStatus =
      style.status === "active" ? "draft" : "active";
    try {
      await statusUpdate.mutateAsync({
        id: style.id,
        payload: { status: nextStatus },
      });
      showToast(
        nextStatus === "active"
          ? "Đã kích hoạt mẫu Fit."
          : "Đã chuyển mẫu Fit về nháp.",
      );
    } catch (err: unknown) {
      showToast(
        getApiError(err, "Cập nhật trạng thái thất bại.").message,
        "error",
      );
    }
  };

  const formError = update.error
    ? getApiError(update.error, "Có lỗi xảy ra khi lưu thông tin mẫu Fit.").message
    : null;
  const hasCodeConflict = isConflictError(update.error);

  if (detail.isLoading) {
    return (
      <div className="space-y-4 animate-pulse pt-2">
        <div className="h-12 w-1/3 rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-8 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-96 w-full rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    );
  }

  if (detail.isError || !style) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        <h3 className="font-semibold text-base">Không tìm thấy mẫu Fit</h3>
        <p className="mt-1">
          {detail.isError
            ? getApiError(detail.error, "Không thể tải thông tin mẫu Fit.").message
            : "Mẫu Fit không tồn tại."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/styles")}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sticky Top Header Container */}
      <div className="sticky top-16 z-30 -mx-4 md:-mx-6 -mt-4 md:-mt-6 px-4 md:px-6 pt-4 pb-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 space-y-4 transition-all">
        {/* Enterprise Compact Header */}
        <StyleHeader
          styleCode={style.styleCode}
          styleName={style.styleName}
          category={style.category}
          status={style.status}
          activeTabLabel={
            activeTab === "general"
              ? "Chi tiết"
              : "Tài liệu sản xuất Tiếng Việt"
          }
          onEditClick={() => setIsEditModalOpen(true)}
        />

        {/* Primary Navigation Tabs */}
        <StyleTabs activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Tab Content */}
      {activeTab === "general" ? (
        <GeneralTab
          style={style}
          imageUrl={imageUrl}
          isDragging={isDragging}
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClearImage={clearLocalImage}
          onToggleStatus={() => void handleToggleStatus()}
          isStatusPending={statusUpdate.isPending}
        />
      ) : (
        <StyleProductionDocTab
          styleId={style.id}
          styleName={style.styleName}
          styleDescription={style.description}
          styleImageUrl={imageUrl || style.baseImageVersionId || undefined}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <StyleFormModal
          isOpen
          styleToEdit={style}
          isSubmitting={update.isPending}
          serverError={formError}
          hasCodeConflict={hasCodeConflict}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={(payload) =>
            void update
              .mutateAsync({ id: style.id, payload })
              .then(() => {
                showToast("Đã cập nhật mẫu Fit.");
                setIsEditModalOpen(false);
              })
              .catch(() => {
                /* Error handled via update.error */
              })
          }
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
