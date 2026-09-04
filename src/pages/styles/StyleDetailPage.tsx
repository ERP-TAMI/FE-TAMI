import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import type { StyleStatus } from "@/types/style";
import { useStyle, useUpdateStyle } from "@/hooks/useStyles";
import {
  useStyleOperationSteps,
  useBulkSaveStyleOperationSteps,
} from "@/hooks/useStyleOperationSteps";
import { useUploadImage } from "@/hooks/useUploadImage";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/shared";
import { StyleFormModal } from "@/components/features/styles/StyleFormModal";
import { StyleOperationStepTable } from "@/components/features/styles/StyleOperationStepTable";
import { UnsavedChangesDialog } from "@/components/features/styles/UnsavedChangesDialog";
import { StyleHeader } from "@/components/features/styles/StyleHeader";
import { GeneralTab } from "@/components/features/styles/GeneralTab";
import { StyleProductionDocTab } from "@/components/features/production-docs/StyleProductionDocTab";
import { getApiError, isConflictError } from "@/lib/apiError";
import { validateImageFile } from "@/lib/validateImageFile";
import type { StyleOperationStepItem } from "@/api/styleOperationStepsApi";
import { InfoIcon, DocsIcon, PageIcon } from "@/icons";

export default function StyleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isStepsTab =
    location.pathname.endsWith("/operation-steps") ||
    location.pathname.endsWith("/steps");
  const isProductionDocTab = location.pathname.endsWith("/production-doc");

  const activeTab: "general" | "steps" | "production_doc" = isStepsTab
    ? "steps"
    : isProductionDocTab
    ? "production_doc"
    : "general";

  const [isProductionDocEditing, setIsProductionDocEditing] = useState(false);
  const [isOperationStepsEditing, setIsOperationStepsEditing] = useState(false);
  const [pendingTab, setPendingTab] = useState<"general" | "steps" | "production_doc" | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    if (!isProductionDocEditing && !isOperationStepsEditing) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.download) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      event.preventDefault();
      setPendingNavigation(`${url.pathname}${url.search}${url.hash}`);
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isProductionDocEditing, isOperationStepsEditing]);

  const navigateToTab = (tab: "general" | "steps" | "production_doc") => {
    if (!id) return;
    if (tab === "production_doc") {
      navigate(`/styles/${id}/production-doc`);
    } else if (tab === "steps") {
      navigate(`/styles/${id}/operation-steps`);
    } else {
      navigate(`/styles/${id}/detail`);
    }
  };

  const handleTabChange = (tab: "general" | "steps" | "production_doc") => {
    if ((isProductionDocEditing || isOperationStepsEditing) && tab !== activeTab) {
      setPendingTab(tab);
      return;
    }
    navigateToTab(tab);
  };

  const handleConfirmLeaveTab = () => {
    if (pendingNavigation) {
      const nextPath = pendingNavigation;
      setPendingNavigation(null);
      navigate(nextPath);
    } else if (pendingTab) {
      navigateToTab(pendingTab);
    }
    setPendingTab(null);
  };

  const detail = useStyle(id);
  const style = detail.data;
  const update = useUpdateStyle();
  const statusUpdate = useUpdateStyle();
  const uploadImage = useUploadImage();

  const stepsQuery = useStyleOperationSteps(id);
  const bulkSaveSteps = useBulkSaveStyleOperationSteps(id || "");

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
      const validationError = validateImageFile(file);
      if (validationError) {
        showToast(validationError, "error");
        return;
      }
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
    <div className="space-y-5 pt-2 md:pt-3">
      <div className="space-y-4">
        <StyleHeader
          styleCode={style.styleCode}
          styleName={style.styleName}
          status={style.status}
          onEditClick={activeTab === "general" ? () => setIsEditModalOpen(true) : undefined}
        />

        <div className="border-b border-gray-200 dark:border-gray-800">
          <nav className="flex space-x-6" aria-label="Tabs">
            <button
              type="button"
              onClick={() => handleTabChange("general")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "general"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <InfoIcon className="w-4 h-4" />
              Thông tin mẫu Fit
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("steps")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "steps"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <DocsIcon className="w-4 h-4" />
              Quy trình công đoạn &amp; KIM
              {(stepsQuery.data?.length ?? 0) > 0 && (
                <span className="ml-1.5 rounded-full bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 text-xs text-brand-600 dark:text-brand-400">
                  {stepsQuery.data?.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("production_doc")}
              className={`flex items-center gap-2 border-b-2 py-2.5 px-1 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "production_doc"
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <PageIcon className="w-4 h-4" />
              Tài liệu sản xuất
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
          onToggleStatus={() => void handleToggleStatus()}
          isStatusPending={statusUpdate.isPending}
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
      ) : (
        <StyleProductionDocTab
          styleId={style.id}
          styleName={style.styleName}
          styleImageUrl={imageUrl || style.baseImageVersionId || undefined}
          onEditingChange={setIsProductionDocEditing}
        />
      )}

      <UnsavedChangesDialog
        isOpen={pendingTab !== null || pendingNavigation !== null}
        onConfirmLeave={handleConfirmLeaveTab}
        onCancel={() => {
          setPendingTab(null);
          setPendingNavigation(null);
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
