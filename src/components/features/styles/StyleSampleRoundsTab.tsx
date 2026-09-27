import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, ConfirmDialog, Modal, Toast } from "@/components/shared";
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  CalenderIcon,
  DownloadIcon,
  CloseIcon,
  ChevronLeftIcon,
} from "@/icons";
import { styleSampleRoundsApi } from "@/api/style-sample-rounds.api";
import { useToast } from "@/hooks/useToast";
import { useUploadStore } from "@/hooks/useUploadStore";
import { getApiError } from "@/lib/apiError";
import { validateImageFile } from "@/lib/validateImageFile";
import {
  useCreateStyleSampleRound,
  useRemoveStyleSampleImage,
  useStyleSampleRounds,
  useUpdateStyleSampleRound,
  useUploadStyleSampleImage,
} from "@/hooks/useStyleSampleRounds";
import type {
  SampleStatus,
  StyleSampleImageItem,
  StyleSampleRoundItem,
} from "@/types/style-sample-round";

const STATUS_OPTIONS: { value: SampleStatus; label: string }[] = [
  { value: "working", label: "Đang làm" },
  { value: "approved", label: "Đạt" },
  { value: "needs_revision", label: "Chưa đạt" },
];

function statusLabel(status: SampleStatus): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

const STATUS_BADGE_STYLES: Record<SampleStatus, string> = {
  working: "bg-gray-500 text-white border-gray-500 dark:bg-gray-600 dark:border-gray-600",
  approved:
    "bg-success-500 text-white border-success-500 dark:bg-success-600 dark:border-success-600",
  needs_revision:
    "bg-error-500 text-white border-error-500 dark:bg-error-600 dark:border-error-600",
};

const STATUS_MENU_WIDTH = 168;
const STATUS_MENU_GAP = 6;
const STATUS_MENU_VIEWPORT_MARGIN = 8;

/**
 * Đổi trạng thái đợt mẫu ngay tại chỗ.
 *
 * Thay cho `<select>` gốc: phần đóng có thể style theo màu badge, nhưng danh
 * sách option khi mở ra là UI mặc định của trình duyệt/OS, không style được.
 * Ở đây cả nút bấm lẫn menu đều tự vẽ (theo mẫu `PoDocumentCategoryPicker`),
 * menu render qua portal ra `document.body` và định vị `fixed` theo tọa độ
 * của nút để không bị cha có `overflow` cắt cụt.
 */
function SampleStatusPicker({
  status,
  isSaving,
  onChange,
}: {
  status: SampleStatus;
  isSaving?: boolean;
  onChange: (status: SampleStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPos(null);
      return;
    }

    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;

      const menuHeight = menuRef.current?.offsetHeight ?? 150;

      let top = trigger.bottom + STATUS_MENU_GAP;
      if (top + menuHeight > window.innerHeight - STATUS_MENU_VIEWPORT_MARGIN) {
        top = Math.max(STATUS_MENU_VIEWPORT_MARGIN, trigger.top - STATUS_MENU_GAP - menuHeight);
      }

      const left = Math.min(
        Math.max(STATUS_MENU_VIEWPORT_MARGIN, trigger.left),
        window.innerWidth - STATUS_MENU_WIDTH - STATUS_MENU_VIEWPORT_MARGIN,
      );

      setMenuPos({ top, left });
    };

    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isSaving}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Bấm để đổi trạng thái"
        className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-theme-xs font-semibold leading-none transition-all hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${STATUS_BADGE_STYLES[status]} ${isSaving ? "" : "cursor-pointer"}`}
      >
        {isSaving && (
          <span
            className="h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        <span>{statusLabel(status)}</span>
        {!isSaving && (
          <svg
            className={`h-3 w-3 shrink-0 opacity-90 transition-transform ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              top: menuPos?.top ?? -9999,
              left: menuPos?.left ?? -9999,
              width: STATUS_MENU_WIDTH,
            }}
            className="fixed z-[100] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {STATUS_OPTIONS.map((opt) => {
              const isCurrent = opt.value === status;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => {
                    setIsOpen(false);
                    if (!isCurrent) onChange(opt.value);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/60 ${isCurrent ? "bg-gray-50 dark:bg-gray-700/40" : ""}`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${STATUS_BADGE_STYLES[opt.value]}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-theme-xs font-semibold text-gray-900 dark:text-white">
                    {opt.label}
                  </span>
                  {isCurrent && (
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

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
  styleId: string;
}

export function StyleSampleRoundsTab({ styleId }: Props) {
  const { toast, showToast, hideToast } = useToast();
  const roundsQuery = useStyleSampleRounds(styleId);
  const rounds = roundsQuery.data ?? [];
  const createMutation = useCreateStyleSampleRound(styleId);
  const updateMutation = useUpdateStyleSampleRound(styleId);
  const uploadMutation = useUploadStyleSampleImage(styleId);
  const removeImageMutation = useRemoveStyleSampleImage(styleId);
  const { startUpload, tickUpload, finishUpload } = useUploadStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<StyleSampleRoundItem | null>(null);
  const [formState, setFormState] = useState<RoundFormState>(emptyFormState());
  const [dragOverRoundId, setDragOverRoundId] = useState<string | null>(null);
  const [uploadErrorsByRound, setUploadErrorsByRound] = useState<
    Record<string, UploadErrorItem[]>
  >({});
  const [pendingRemoveImage, setPendingRemoveImage] = useState<{
    roundId: string;
    image: StyleSampleImageItem;
  } | null>(null);
  const [viewingImage, setViewingImage] = useState<{
    roundId: string;
    image: StyleSampleImageItem;
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
    setEditingRound(null);
    setIsFormOpen(true);
  };

  const openEditForm = (round: StyleSampleRoundItem) => {
    setEditingRound(round);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (round: StyleSampleRoundItem, status: SampleStatus) => {
    if (status === round.status) return;
    setStatusUpdatingRoundId(round.id);
    try {
      await updateMutation.mutateAsync({ roundId: round.id, input: { status } });
      showToast("Đã cập nhật trạng thái.");
    } catch (err) {
      showToast(getApiError(err, "Cập nhật trạng thái thất bại.").message, "error");
    } finally {
      setStatusUpdatingRoundId(null);
    }
  };

  const handleSubmitForm = async () => {
    const input = {
      sampleDate: formState.sampleDate || undefined,
      feedback: formState.feedback.trim() || undefined,
      status: formState.status,
    };
    try {
      if (editingRound) {
        await updateMutation.mutateAsync({ roundId: editingRound.id, input });
        showToast("Đã cập nhật lần may mẫu.");
      } else {
        await createMutation.mutateAsync(input);
        showToast("Đã thêm lần may mẫu mới.");
      }
      setIsFormOpen(false);
    } catch (err) {
      showToast(getApiError(err, "Lưu lần may mẫu thất bại.").message, "error");
    }
  };

  const handleFiles = (round: StyleSampleRoundItem, fileList: FileList | File[]) => {
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

    startUpload(validFiles.length, `Lần ${round.roundNo} - mẫu Fit`);

    (async () => {
      for (const file of validFiles) {
        try {
          await uploadMutation.mutateAsync({ roundId: round.id, file });
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
    setUploadErrorsByRound((prev) => ({
      ...prev,
      [roundId]: (prev[roundId] || []).filter((item) => item.tempId !== tempId),
    }));
  };

  const handleConfirmRemoveImage = async () => {
    if (!pendingRemoveImage) return;
    try {
      await removeImageMutation.mutateAsync({
        roundId: pendingRemoveImage.roundId,
        imageId: pendingRemoveImage.image.id,
      });
      showToast("Đã xoá ảnh khỏi lần may mẫu.");
    } catch (err) {
      showToast(getApiError(err, "Xoá ảnh thất bại.").message, "error");
    } finally {
      setPendingRemoveImage(null);
    }
  };

  const handleDownloadImage = async (roundId: string, image: StyleSampleImageItem) => {
    // No noopener/noreferrer: those make window.open() return null, so we couldn't navigate it later.
    const popup = window.open("", "_blank");
    try {
      const { url } = await styleSampleRoundsApi.getImageDownloadUrl(styleId, roundId, image.id);
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
          Lần may mẫu ({rounds.length})
        </h3>
        <Button size="sm" onClick={openCreateForm}>
          <PlusIcon className="h-4 w-4" />
          Thêm lần may mẫu
        </Button>
      </div>

      {roundsQuery.isLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
          Đang tải danh sách lần may mẫu...
        </div>
      ) : rounds.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-theme-base font-semibold text-gray-900 dark:text-white">
            Chưa có lần may mẫu nào.
          </p>
          <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
            Bấm "Thêm lần may mẫu" để ghi nhận lần may mẫu đầu tiên cho mẫu Fit này.
          </p>
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
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverRoundId(round.id);
                }}
                onDragLeave={() => setDragOverRoundId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverRoundId(null);
                  if (e.dataTransfer.files?.length) handleFiles(round, e.dataTransfer.files);
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-mono text-sm font-bold text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      {round.roundNo}
                    </span>
                    <div className="space-y-2.5">
                      <h4 className="text-theme-base font-bold leading-none text-gray-900 dark:text-white">
                        Lần {round.roundNo}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <SampleStatusPicker
                          status={round.status}
                          isSaving={statusUpdatingRoundId === round.id}
                          onChange={(status) => void handleStatusChange(round, status)}
                        />
                        <span className="flex h-7 items-center gap-1.5 text-theme-sm font-medium leading-none text-gray-500 dark:text-gray-400">
                          <CalenderIcon className="h-4 w-4" />
                          {formatDate(round.sampleDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => openEditForm(round)}>
                    <PencilIcon className="h-3.5 w-3.5" />
                    Sửa
                  </Button>
                </div>

                {round.feedback && (
                  <p className="whitespace-pre-line border-b border-gray-100 p-5 text-theme-sm text-gray-700 dark:border-gray-800 dark:text-gray-300">
                    {round.feedback}
                  </p>
                )}

                <div className="p-5">
                  {roundErrors.length > 0 && (
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
                        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[round.id]?.click()}
                      className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 text-gray-400 transition-colors hover:border-brand-400 hover:text-brand-500 dark:border-gray-700 dark:hover:border-brand-700"
                    >
                      <PlusIcon className="h-6 w-6" />
                      <span className="text-theme-xs">Thêm ảnh</span>
                    </button>
                    <input
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
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRound ? `Sửa lần may mẫu ${editingRound.roundNo}` : "Thêm lần may mẫu mới"}
        size="md"
        footer={
          <div className="flex justify-end gap-2.5">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={() => void handleSubmitForm()} loading={isSubmitting}>
              {editingRound ? "Lưu thay đổi" : "Tạo lần may mẫu"}
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
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Ghi chú
            </label>
            <textarea
              rows={3}
              value={formState.feedback}
              onChange={(e) => setFormState((s) => ({ ...s, feedback: e.target.value }))}
              placeholder="Nhận xét về lần may mẫu này..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingRemoveImage !== null}
        title="Xoá ảnh"
        description={
          <>
            Bạn có chắc muốn xoá ảnh <strong>{pendingRemoveImage?.image.fileName}</strong> khỏi
            lần may mẫu này?
          </>
        }
        confirmLabel="Xoá ảnh"
        variant="danger"
        isSubmitting={removeImageMutation.isPending}
        onConfirm={() => void handleConfirmRemoveImage()}
        onClose={() => setPendingRemoveImage(null)}
      />

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

              <button
                type="button"
                onClick={() => void handleDownloadImage(viewingImage.roundId, viewingImage.image)}
                className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <DownloadIcon className="h-4 w-4" />
                Tải xuống
              </button>
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
