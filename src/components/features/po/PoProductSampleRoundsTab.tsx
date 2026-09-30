import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EntityHistoryButton } from "@/components/features/audit/EntityHistoryButton";
import {
  Button,
  ConfirmDialog,
  Modal,
  SampleStatusPicker,
  SAMPLE_STATUS_OPTIONS,
  sampleStatusLabel,
  Toast,
} from "@/components/shared";
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  CalenderIcon,
  DownloadIcon,
  CloseIcon,
  ChevronLeftIcon,
} from "@/icons";
import { poApi } from "@/api/po.api";
import { useToast } from "@/hooks/useToast";
import { useUploadStore } from "@/hooks/useUploadStore";
import { getApiError } from "@/lib/apiError";
import { validateImageFile } from "@/lib/validateImageFile";
import {
  useCreateProductSampleRound,
  useProductSampleRounds,
  useRemoveProductSampleImage,
  useUpdateProductSampleRound,
  useUploadProductSampleImage,
} from "@/hooks/usePurchaseOrders";
import type { ProductSampleImage, ProductSampleRound } from "@/types/po";
import type { SampleStatus } from "@/types/style-sample-round";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface RoundFormState {
  sampleDate: string;
  feedback: string;
  status: SampleStatus;
}

function emptyFormState(): RoundFormState {
  return { sampleDate: todayIso(), feedback: "", status: "working" };
}

interface UploadErrorItem {
  tempId: string;
  fileName: string;
  errorMessage: string;
}

interface Props {
  poId: string;
  productId: string;
  readOnly?: boolean;
}

export function PoProductSampleRoundsTab({ poId, productId, readOnly = false }: Props) {
  const { toast, showToast, hideToast } = useToast();
  const roundsQuery = useProductSampleRounds(poId, productId);
  const rounds = roundsQuery.data ?? [];
  const createMutation = useCreateProductSampleRound();
  const updateMutation = useUpdateProductSampleRound();
  const uploadMutation = useUploadProductSampleImage();
  const removeImageMutation = useRemoveProductSampleImage();
  const { startUpload, tickUpload, finishUpload } = useUploadStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<ProductSampleRound | null>(null);
  const [formState, setFormState] = useState<RoundFormState>(emptyFormState());
  const [dragOverRoundId, setDragOverRoundId] = useState<string | null>(null);
  const [uploadErrorsByRound, setUploadErrorsByRound] = useState<
    Record<string, UploadErrorItem[]>
  >({});
  const [pendingRemoveImage, setPendingRemoveImage] = useState<{
    roundId: string;
    image: ProductSampleImage;
  } | null>(null);
  const [viewingImage, setViewingImage] = useState<{
    roundId: string;
    image: ProductSampleImage;
  } | null>(null);
  const [statusUpdatingRoundId, setStatusUpdatingRoundId] = useState<string | null>(null);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const sampleDateInputRef = useRef<HTMLInputElement>(null);

  const viewingRoundImages = viewingImage
    ? rounds.find((r) => r.id === viewingImage.roundId)?.images ?? []
    : [];
  const viewingIndex = viewingImage
    ? viewingRoundImages.findIndex((img) => img.id === viewingImage.image.id)
    : -1;
  const viewingPrev = viewingIndex > 0 ? viewingRoundImages[viewingIndex - 1] : null;
  const viewingNext =
    viewingIndex >= 0 && viewingIndex < viewingRoundImages.length - 1
      ? viewingRoundImages[viewingIndex + 1]
      : null;

  useEffect(() => {
    if (!viewingImage) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewingImage(null);
      else if (e.key === "ArrowLeft" && viewingPrev)
        setViewingImage({ roundId: viewingImage.roundId, image: viewingPrev });
      else if (e.key === "ArrowRight" && viewingNext)
        setViewingImage({ roundId: viewingImage.roundId, image: viewingNext });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewingImage, viewingPrev, viewingNext]);

  useEffect(() => {
    if (!isFormOpen) return;
    if (editingRound) {
      setFormState({
        sampleDate: editingRound.sampleDate?.slice(0, 10) || todayIso(),
        feedback: editingRound.feedback || "",
        status: editingRound.status,
      });
    } else {
      setFormState(emptyFormState());
    }
  }, [isFormOpen, editingRound]);

  const openCreateForm = () => {
    if (readOnly) return;
    setEditingRound(null);
    setIsFormOpen(true);
  };

  const openEditForm = (round: ProductSampleRound) => {
    if (readOnly) return;
    setEditingRound(round);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (round: ProductSampleRound, status: SampleStatus) => {
    if (readOnly || status === round.status) return;
    setStatusUpdatingRoundId(round.id);
    try {
      await updateMutation.mutateAsync({ poId, productId, roundId: round.id, input: { status } });
      showToast("Đã cập nhật trạng thái.");
    } catch (err) {
      showToast(getApiError(err, "Cập nhật trạng thái thất bại.").message, "error");
    } finally {
      setStatusUpdatingRoundId(null);
    }
  };

  const handleSubmitForm = async () => {
    if (readOnly) return;
    const input = {
      sampleDate: formState.sampleDate || undefined,
      feedback: formState.feedback.trim() || undefined,
      status: formState.status,
    };
    try {
      if (editingRound) {
        await updateMutation.mutateAsync({
          poId,
          productId,
          roundId: editingRound.id,
          input,
        });
        showToast("Đã cập nhật đợt may mẫu.");
      } else {
        await createMutation.mutateAsync({ poId, productId, input });
        showToast("Đã thêm đợt may mẫu mới.");
      }
      setIsFormOpen(false);
    } catch (err) {
      showToast(getApiError(err, "Lưu đợt may mẫu thất bại.").message, "error");
    }
  };

  const handleFiles = (round: ProductSampleRound, fileList: FileList | File[]) => {
    if (readOnly) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    files.forEach((file) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        const tempId = `${file.name}_${file.size}_${Date.now()}_${Math.random()}`;
        setUploadErrorsByRound((prev) => ({
          ...prev,
          [round.id]: [
            ...(prev[round.id] || []),
            { tempId, fileName: file.name, errorMessage: validationError },
          ],
        }));
        return;
      }
      validFiles.push(file);
    });
    if (validFiles.length === 0) return;

    startUpload(validFiles.length, `Đợt ${round.roundNo} - mẫu PO`);

    (async () => {
      for (const file of validFiles) {
        try {
          await uploadMutation.mutateAsync({ poId, productId, roundId: round.id, file });
        } catch (err) {
          const tempId = `${file.name}_${file.size}_${Date.now()}_${Math.random()}`;
          setUploadErrorsByRound((prev) => ({
            ...prev,
            [round.id]: [
              ...(prev[round.id] || []),
              {
                tempId,
                fileName: file.name,
                errorMessage: getApiError(err, `Tải "${file.name}" thất bại.`).message,
              },
            ],
          }));
        } finally {
          tickUpload(file.name);
        }
      }
      finishUpload();
    })();
  };

  const dismissUploadError = (roundId: string, tempId: string) => {
    if (readOnly) return;
    setUploadErrorsByRound((prev) => ({
      ...prev,
      [roundId]: (prev[roundId] || []).filter((item) => item.tempId !== tempId),
    }));
  };

  const handleConfirmRemoveImage = async () => {
    if (readOnly || !pendingRemoveImage) return;
    try {
      await removeImageMutation.mutateAsync({
        poId,
        productId,
        roundId: pendingRemoveImage.roundId,
        imageId: pendingRemoveImage.image.id,
      });
      showToast("Đã xoá ảnh khỏi đợt may mẫu.");
    } catch (err) {
      showToast(getApiError(err, "Xoá ảnh thất bại.").message, "error");
    } finally {
      setPendingRemoveImage(null);
    }
  };

  const handleDownloadImage = async (roundId: string, image: ProductSampleImage) => {
    if (readOnly) return;
    // No noopener/noreferrer: those make window.open() return null, so we couldn't navigate it later.
    const popup = window.open("", "_blank");
    try {
      const { url } = await poApi.getProductSampleImageDownloadUrl(
        poId,
        productId,
        roundId,
        image.id,
      );
      if (popup) popup.location.href = url;
    } catch (err) {
      popup?.close();
      showToast(getApiError(err, "Không thể tải ảnh về.").message, "error");
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-theme-base font-bold text-gray-900 dark:text-white">
          Đợt may mẫu ({rounds.length})
        </h3>
        <div className="flex items-center gap-2">
          <EntityHistoryButton
            aggregateType="PurchaseOrderProductSampleRound"
            parentId={productId}
            title="Lịch sử: Đợt may mẫu"
          />
          {!readOnly && (
            <Button size="sm" onClick={openCreateForm}>
              <PlusIcon className="h-4 w-4" />
              Thêm đợt may mẫu
            </Button>
          )}
        </div>
      </div>

      {roundsQuery.isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          Đang tải danh sách đợt may mẫu...
        </div>
      ) : rounds.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-theme-base font-semibold text-gray-900 dark:text-white">
            Chưa có đợt may mẫu nào.
          </p>
          {!readOnly && <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            Bấm "Thêm đợt may mẫu" để ghi nhận đợt may mẫu đầu tiên cho sản phẩm này.
          </p>}
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round) => {
            const roundErrors = uploadErrorsByRound[round.id] || [];
            const isDragOver = dragOverRoundId === round.id;
            return (
              <div
                key={round.id}
                className={`overflow-hidden rounded-2xl border shadow-xs transition-colors dark:bg-gray-900 ${
                  isDragOver
                    ? "border-brand-400 bg-brand-50/40 dark:border-brand-700"
                    : "border-gray-200 bg-white dark:border-gray-800"
                }`}
                onDragOver={readOnly ? undefined : (e) => {
                  e.preventDefault();
                  setDragOverRoundId(round.id);
                }}
                onDragLeave={readOnly ? undefined : () => setDragOverRoundId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverRoundId(null);
                  if (!readOnly && e.dataTransfer.files?.length) {
                    handleFiles(round, e.dataTransfer.files);
                  }
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-mono text-sm font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      {round.roundNo}
                    </span>
                    <div className="space-y-2.5">
                      <h4 className="text-theme-base font-bold leading-none text-gray-900 dark:text-white">
                        Đợt may mẫu {round.roundNo}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        {readOnly ? (
                          <span className="inline-flex h-7 items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-theme-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {sampleStatusLabel(round.status)}
                          </span>
                        ) : (
                          <SampleStatusPicker
                            status={round.status}
                            isSaving={statusUpdatingRoundId === round.id}
                            onChange={(status) => void handleStatusChange(round, status)}
                          />
                        )}
                        <span className="flex h-7 items-center gap-1.5 text-theme-sm font-medium leading-none text-gray-500 dark:text-gray-400">
                          <CalenderIcon className="h-4 w-4" />
                          {formatDate(round.sampleDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!readOnly && (
                    <Button variant="primary" size="sm" onClick={() => openEditForm(round)}>
                      <PencilIcon className="h-3.5 w-3.5" />
                      Sửa
                    </Button>
                  )}
                </div>

                {round.feedback && (
                  <p className="whitespace-pre-line border-b border-gray-100 p-5 text-theme-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {round.feedback}
                  </p>
                )}

                <div className="p-5">
                  {!readOnly && roundErrors.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {roundErrors.map((item) => (
                        <div
                          key={item.tempId}
                          className="flex items-center justify-between gap-3 rounded-xl border border-error-200 bg-error-50/60 px-3 py-2 text-theme-xs dark:border-error-900/40 dark:bg-error-950/20"
                        >
                          <span className="truncate font-medium text-error-700 dark:text-error-400">
                            {item.fileName}: {item.errorMessage}
                          </span>
                          <button
                            type="button"
                            onClick={() => dismissUploadError(round.id, item.tempId)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,200px))] gap-3">
                    {round.images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <button
                          type="button"
                          onClick={() => setViewingImage({ roundId: round.id, image })}
                          className="block h-full w-full cursor-zoom-in"
                        >
                          <img
                            src={image.url}
                            alt={image.fileName}
                            title={image.fileName}
                            className="h-full w-full object-cover"
                          />
                        </button>
                        {!readOnly && <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => void handleDownloadImage(round.id, image)}
                            className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70"
                            title="Tải ảnh về"
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingRemoveImage({ roundId: round.id, image })}
                            className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-error-600"
                            title="Gỡ ảnh"
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>}
                      </div>
                    ))}

                    {!readOnly && <button
                      type="button"
                      onClick={() => fileInputRefs.current[round.id]?.click()}
                      className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:hover:border-brand-700"
                    >
                      <PlusIcon className="h-6 w-6" />
                      <span className="text-theme-xs">Thêm ảnh</span>
                    </button>}
                    {!readOnly && <input
                      ref={(el) => {
                        fileInputRefs.current[round.id] = el;
                      }}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => {
                        if (e.target.files?.length) handleFiles(round, e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          editingRound ? `Sửa đợt may mẫu ${editingRound.roundNo}` : "Thêm đợt may mẫu mới"
        }
        size="md"
        footer={
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={() => void handleSubmitForm()} loading={isSubmitting}>
              {editingRound ? "Lưu thay đổi" : "Tạo đợt may mẫu"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Ngày may mẫu
            </label>
            <div className="relative flex items-center">
              <input
                ref={sampleDateInputRef}
                type="date"
                value={formState.sampleDate}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker?.();
                  } catch {
                    /* ignore when unsupported */
                  }
                }}
                onChange={(e) => setFormState((s) => ({ ...s, sampleDate: e.target.value }))}
                className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 px-3 pr-10 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    sampleDateInputRef.current?.showPicker?.();
                  } catch {
                    /* ignore when unsupported */
                  }
                }}
                className="absolute right-3 p-1 text-gray-400 hover:text-brand-600 transition-colors dark:hover:text-brand-400 cursor-pointer"
                title="Bấm để mở lịch chọn ngày"
              >
                <CalenderIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <select
              value={formState.status}
              onChange={(e) =>
                setFormState((s) => ({ ...s, status: e.target.value as SampleStatus }))
              }
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {SAMPLE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Ý kiến phản hồi (Feedback)
            </label>
            <textarea
              rows={3}
              value={formState.feedback}
              onChange={(e) => setFormState((s) => ({ ...s, feedback: e.target.value }))}
              placeholder="Nhận xét về form dáng, đường may..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </Modal>}

      {!readOnly && <ConfirmDialog
        open={pendingRemoveImage !== null}
        title="Xoá ảnh"
        description={
          <>
            Bạn có chắc muốn xoá ảnh <strong>{pendingRemoveImage?.image.fileName}</strong> khỏi
            đợt may mẫu này?
          </>
        }
        confirmLabel="Xoá ảnh"
        variant="danger"
        isSubmitting={removeImageMutation.isPending}
        onConfirm={() => void handleConfirmRemoveImage()}
        onClose={() => setPendingRemoveImage(null)}
      />}

      {viewingImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[95] flex flex-col bg-[#000]"
            role="dialog"
            aria-modal="true"
            onClick={() => setViewingImage(null)}
          >
            {/* Top bar: 1 hàng duy nhất, đóng bên trái, tải xuống bên phải */}
            <div
              className="flex items-center justify-between gap-3 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                aria-label="Đóng"
                title="Đóng (Esc)"
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
              >
                <CloseIcon className="h-5 w-5" />
              </button>

              {viewingRoundImages.length > 1 && (
                <span className="text-sm font-medium text-gray-300">
                  {viewingIndex + 1}/{viewingRoundImages.length}
                </span>
              )}

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => void handleDownloadImage(viewingImage.roundId, viewingImage.image)}
                  className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Tải xuống
                </button>
              )}
            </div>

            {/* Vùng ảnh + mũi tên điều hướng */}
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-4">
              {viewingPrev && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingImage({ roundId: viewingImage.roundId, image: viewingPrev });
                  }}
                  aria-label="Ảnh trước"
                  className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
              )}

              <div
                className="h-full max-h-[min(60vh,750px)] w-full max-w-[min(68vw,1050px)]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={viewingImage.image.url}
                  alt={viewingImage.image.fileName}
                  className="h-full w-full rounded-lg object-contain shadow-2xl"
                />
              </div>

              {viewingNext && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingImage({ roundId: viewingImage.roundId, image: viewingNext });
                  }}
                  aria-label="Ảnh sau"
                  className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
                >
                  <ChevronLeftIcon className="h-6 w-6 rotate-180" />
                </button>
              )}

              <div
                className="absolute bottom-6 left-1/2 max-w-[90vw] -translate-x-1/2 truncate rounded-full bg-black/60 px-4 py-1.5 text-sm text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {viewingImage.image.fileName}
              </div>
            </div>
          </div>,
          document.body,
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
