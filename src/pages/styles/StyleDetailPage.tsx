import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { StyleStatus } from "@/types/style";
import { useStyle, useUpdateStyle } from "@/hooks/useStyles";
import {
  useStyleOperationSteps,
  useBulkSaveStyleOperationSteps,
} from "@/hooks/useStyleOperationSteps";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useUploadStore } from "@/hooks/useUploadStore";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog, Toast } from "@/components/shared";
import { StyleFormModal } from "@/components/features/styles/StyleFormModal";
import { StyleOperationStepTable } from "@/components/features/styles/StyleOperationStepTable";
import { UnsavedChangesDialog } from "@/components/features/styles/UnsavedChangesDialog";
import { useUnsavedChangesWarning } from "@/hooks/useNavigationBlocker";
import { StyleHeader } from "@/components/features/styles/StyleHeader";
import { GeneralTab } from "@/components/features/styles/GeneralTab";
import { StyleProductionDocTab } from "@/components/features/production-docs/StyleProductionDocTab";
import { StyleDocumentsTab } from "@/components/features/styles/StyleDocumentsTab";
import { StyleSampleRoundsTab } from "@/components/features/styles/StyleSampleRoundsTab";
import { getApiError, isConflictError } from "@/lib/apiError";
import { validateImageFile } from "@/lib/validateImageFile";
import type { StyleOperationStepItem } from "@/api/styleOperationStepsApi";

export default function StyleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isStepsTab =
    location.pathname.endsWith("/operation-steps") ||
    location.pathname.endsWith("/steps");
  const isProductionDocTab = location.pathname.endsWith("/production-doc");
  const isDocumentsTab = location.pathname.endsWith("/documents");
  const isSampleRoundsTab = location.pathname.endsWith("/sample-rounds");

  const activeTab: "general" | "steps" | "production_doc" | "documents" | "sample_rounds" =
    isStepsTab
      ? "steps"
      : isProductionDocTab
      ? "production_doc"
      : isDocumentsTab
      ? "documents"
      : isSampleRoundsTab
      ? "sample_rounds"
      : "general";

  const [isProductionDocEditing, setIsProductionDocEditing] = useState(false);
  const [isOperationStepsEditing, setIsOperationStepsEditing] = useState(false);

  // Blocks browser back/forward, Link clicks, and tab switches alike (all of
  // them go through React Router navigation) — not just same-origin <a>
  // clicks, which a hand-rolled click-intercept can't cover.
  const isEditingUnsaved = isProductionDocEditing || isOperationStepsEditing;
  const navigationBlocker = useUnsavedChangesWarning(
    isEditingUnsaved,
    "Bạn có dữ liệu chưa được lưu. Vui lòng bấm lưu trước khi rời khỏi trang!",
  );

  const navigateToTab = (
    tab: "general" | "steps" | "production_doc" | "documents" | "sample_rounds",
  ) => {
    if (!id) return;
    if (tab === "production_doc") {
      navigate(`/styles/${id}/production-doc`);
    } else if (tab === "steps") {
      navigate(`/styles/${id}/operation-steps`);
    } else if (tab === "documents") {
      navigate(`/styles/${id}/documents`);
    } else if (tab === "sample_rounds") {
      navigate(`/styles/${id}/sample-rounds`);
    } else {
      navigate(`/styles/${id}/detail`);
    }
  };

  const handleTabChange = (
    tab: "general" | "steps" | "production_doc" | "documents" | "sample_rounds",
  ) => {
    navigateToTab(tab);
  };

  const detail = useStyle(id);
  const style = detail.data;
  const update = useUpdateStyle();
  const statusUpdate = useUpdateStyle();
  const uploadImage = useUploadImage();
  const { startUpload, tickUpload, finishUpload } = useUploadStore();

  const stepsQuery = useStyleOperationSteps(id);
  const bulkSaveSteps = useBulkSaveStyleOperationSteps(id || "");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isToggleStatusConfirmOpen, setIsToggleStatusConfirmOpen] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (style?.baseImageKey) setImageUrl(style.baseImageKey);
  }, [style?.baseImageKey]);

  const handleUploadAndSaveImage = useCallback(
    async (file: File) => {
      if (!style) return;
      // Guard against a second paste/drop/file-select firing while the
      // first upload is still in flight — without this, two concurrent
      // presign+save calls race and whichever resolves last silently wins.
      if (uploadImage.isPending || update.isPending) return;
      const validationError = validateImageFile(file);
      if (validationError) {
        showToast(validationError, "error");
        return;
      }
      // Tracked in the global upload store (rendered from AppLayout, not
      // this page) so progress/completion stays visible even if the user
      // navigates away before the upload settles — local component state
      // (setImageUrl/showToast below) silently no-ops once unmounted.
      startUpload(1, style.styleName || "Ảnh mẫu Fit");
      try {
        const res = await uploadImage.mutateAsync({
          entityType: "style",
          entityId: style.id,
          purpose: "sample_image",
          file,
        });
        setImageUrl(res.previewUrl);
        await update.mutateAsync({
          id: style.id,
          payload: { baseImageKey: res.objectKey },
        });
        showToast("Đã tải và lưu ảnh mẫu Fit thành công.");
      } catch (err) {
        showToast(getApiError(err, "Tải ảnh mẫu thất bại.").message, "error");
      } finally {
        tickUpload(file.name);
        finishUpload();
      }
    },
    [
      style,
      uploadImage,
      update,
      showToast,
      startUpload,
      tickUpload,
      finishUpload,
    ],
  );

  const clearLocalImage = useCallback(async () => {
    if (!style) return;
    try {
      setImageUrl(null);
      await update.mutateAsync({
        id: style.id,
        payload: { baseImageKey: null },
      });
      showToast("Đã xóa ảnh mẫu Fit.");
    } catch (err) {
      showToast(getApiError(err, "Xóa ảnh mẫu thất bại.").message, "error");
    }
  }, [style, update, showToast]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (activeTab !== "general") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) void handleUploadAndSaveImage(file);
        }
      }
    },
    [activeTab, handleUploadAndSaveImage],
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
      setIsToggleStatusConfirmOpen(false);
    } catch (err: unknown) {
      showToast(
        getApiError(err, "Cập nhật trạng thái thất bại.").message,
        "error",
      );
    }
  };

  const handleSaveSteps = async (
    stepsData: Partial<StyleOperationStepItem>[],
    baseDays?: number,
  ) => {
    if (!id) return;
    try {
      const cleanedSteps = (stepsData || []).map((step, orderIndex) => ({
        id: step.id ? String(step.id) : undefined,
        stepName: step.stepName || "",
        description: step.description || undefined,
        timePerPiece: Number(step.timePerPiece) || 0,
        ssv: Number(step.ssv) || 0,
        targetTotal: Number(step.targetTotal) || 0,
        note: step.note || undefined,
        orderIndex,
        isGroup: Boolean(step.isGroup),
        stageId: step.stageId ? String(step.stageId) : undefined,
        groupId: step.groupId ? String(step.groupId) : undefined,
        parentStepId: step.parentStepId ? String(step.parentStepId) : undefined,
        groupItems: step.groupItems || undefined,
      }));

      await bulkSaveSteps.mutateAsync({ steps: cleanedSteps, as3bCmBaseDays: baseDays });
      showToast("Đã lưu quy trình công đoạn mẫu Fit thành công.");
    } catch (err) {
      showToast(getApiError(err, "Lưu quy trình công đoạn thất bại.").message, "error");
      throw err;
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
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <StyleHeader
          styleCode={style.styleCode}
          styleName={style.styleName}
          status={style.status}
        />

        <div className="-mt-1 border-b border-gray-200 dark:border-gray-800">
          <nav className="-mb-px flex gap-6 text-theme-sm font-semibold">
            <button
              type="button"
              onClick={() => handleTabChange("general")}
              className={`border-b-2 py-2.5 transition-colors ${
                activeTab === "general"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Thông tin mẫu Fit
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("steps")}
              className={`border-b-2 py-2.5 transition-colors ${
                activeTab === "steps"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Quy trình công đoạn
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("production_doc")}
              className={`border-b-2 py-2.5 transition-colors ${
                activeTab === "production_doc"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Tài liệu sản xuất
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("documents")}
              className={`border-b-2 py-2.5 transition-colors ${
                activeTab === "documents"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Tài liệu đính kèm
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("sample_rounds")}
              className={`border-b-2 py-2.5 transition-colors ${
                activeTab === "sample_rounds"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Lần may mẫu
            </button>
          </nav>
        </div>
      </div>

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
          onToggleStatus={() => setIsToggleStatusConfirmOpen(true)}
          isStatusPending={statusUpdate.isPending}
          onEditClick={() => setIsEditModalOpen(true)}
        />
      ) : activeTab === "steps" ? (
        <StyleOperationStepTable
          styleId={style.id}
          steps={stepsQuery.data || []}
          cmBaseDays={style.as3bCmBaseDays || 30}
          canEdit={true}
          onEditingChange={setIsOperationStepsEditing}
          onSave={handleSaveSteps}
          imageUrl={imageUrl}
          styleCode={style.styleCode}
          styleName={style.styleName}
          onImageChange={(file) => void handleUploadAndSaveImage(file)}
        />
      ) : activeTab === "production_doc" ? (
        <StyleProductionDocTab
          styleId={style.id}
          styleName={style.styleName}
          styleImageUrl={imageUrl || style.baseImageKey || undefined}
          onEditingChange={setIsProductionDocEditing}
        />
      ) : activeTab === "documents" ? (
        <StyleDocumentsTab styleId={style.id} />
      ) : (
        <StyleSampleRoundsTab styleId={style.id} />
      )}

      <UnsavedChangesDialog
        isOpen={navigationBlocker.state === "blocked"}
        onConfirmLeave={() => {
          if (navigationBlocker.state === "blocked") navigationBlocker.proceed();
        }}
        onCancel={() => {
          if (navigationBlocker.state === "blocked") navigationBlocker.reset();
        }}
      />

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
              .catch(() => {})
          }
        />
      )}

      {isToggleStatusConfirmOpen && (
        <ConfirmDialog
          open
          title={style.status === "active" ? "Chuyển về Nháp" : "Kích hoạt mẫu Fit"}
          description={
            <>
              Bạn có chắc chắn muốn{" "}
              {style.status === "active" ? "chuyển về nháp" : "kích hoạt"} mẫu Fit{" "}
              <strong className="text-brand-600 dark:text-brand-400 font-mono break-all">
                {style.styleCode}
              </strong>
              ?
            </>
          }
          confirmLabel={style.status === "active" ? "Chuyển về Nháp" : "Kích hoạt"}
          isSubmitting={statusUpdate.isPending}
          onConfirm={() => void handleToggleStatus()}
          onClose={() => setIsToggleStatusConfirmOpen(false)}
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
