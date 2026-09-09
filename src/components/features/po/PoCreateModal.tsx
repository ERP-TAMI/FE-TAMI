import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Modal, Button, FileTypeIcon } from "@/components/shared";
import { CloseLineIcon } from "@/icons";
import type { CreatePoInput, AttachedDocItem } from "@/types/po";
import {
  PO_DOCUMENT_CATEGORIES,
  getDocumentCategoryInfo,
  detectDocumentPurpose,
} from "@/lib/poDocuments";

/* ---------- Helper: format file size ---------- */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ---------- Memoized File Row (tránh re-render toàn bộ danh sách) ---------- */
interface FileRowProps {
  item: AttachedDocItem;
  originalIndex: number;
  previewUrl: string | undefined;
  onRemove: (index: number) => void;
  onUpdatePurpose: (index: number, newPurpose: string) => void;
}

const FileRow = React.memo(function FileRow({
  item,
  originalIndex,
  previewUrl,
  onRemove,
  onUpdatePurpose,
}: FileRowProps) {
  const itemCatInfo = getDocumentCategoryInfo(item.purpose);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-2.5 sm:p-3 text-sm transition hover:border-brand-300 hover:bg-white dark:border-gray-800 dark:bg-gray-800/60 dark:hover:bg-gray-800">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="preview"
            className="h-10 w-10 rounded-lg object-cover border border-gray-200 shrink-0 dark:border-gray-700 shadow-2xs"
          />
        ) : (
          <FileTypeIcon fileName={item.file.name} size="sm" />
        )}
        <div className="min-w-0 flex-1">
          <p
            className="truncate font-semibold text-gray-900 dark:text-gray-100"
            title={item.file.name}
          >
            {item.file.name}
          </p>
          <span className="font-mono text-xs text-gray-400">
            {formatFileSize(item.file.size)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <select
          value={item.purpose}
          onChange={(e) => onUpdatePurpose(originalIndex, e.target.value)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold outline-none transition cursor-pointer ${itemCatInfo.badgeClass}`}
          title="Đổi phân loại tài liệu"
        >
          {PO_DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onRemove(originalIndex)}
          className="rounded-xl p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-error-600 dark:hover:bg-red-950/40 dark:hover:text-error-400 cursor-pointer"
          title="Xóa tệp này"
        >
          <CloseLineIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

export interface UploadProgress {
  /** Total files to upload */
  total: number;
  /** Number of files already completed */
  completed: number;
  /** Name of the file currently being uploaded */
  currentFileName?: string;
}

interface Props {
  isOpen: boolean;
  isPending: boolean;
  uploadProgress?: UploadProgress | null;
  onClose: () => void;
  onSubmit: (input: CreatePoInput, files: AttachedDocItem[]) => Promise<void>;
}

export function PoCreateModal({ isOpen, isPending, uploadProgress, onClose, onSubmit }: Props) {
  // Giai đoạn tạo PO: 1 = Thông tin chung, 2 = Phân loại tài liệu
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Dữ liệu giai đoạn 1 (Thông tin chung)
  const [poCode, setPoCode] = useState("");
  const [customerPoCode, setCustomerPoCode] = useState("");
  const [customerNameSnapshot, setCustomerNameSnapshot] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");

  // Dữ liệu giai đoạn 2 (Tài liệu đính kèm)
  const [attachedFiles, setAttachedFiles] = useState<AttachedDocItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("other");
  const [fileFilterCategory, setFileFilterCategory] = useState<string>("all");
  const [isDragOver, setIsDragOver] = useState(false);

  // Stable cache cho preview URLs — dùng useRef để tránh extra render
  const previewCacheRef = useRef<Map<File, string>>(new Map());

  // Tính preview URLs đồng bộ trong render (không gây re-render thêm)
  const previewUrls = useMemo(() => {
    const cache = previewCacheRef.current;
    const currentFiles = new Set<File>();

    for (const item of attachedFiles) {
      if (item.file.type.startsWith("image/")) {
        currentFiles.add(item.file);
        if (!cache.has(item.file)) {
          cache.set(item.file, URL.createObjectURL(item.file));
        }
      }
    }

    // Thu hồi URLs của các file đã bị xóa khỏi danh sách
    for (const [file, url] of cache) {
      if (!currentFiles.has(file)) {
        URL.revokeObjectURL(url);
        cache.delete(file);
      }
    }

    // Trả về snapshot immutable để React detect changes
    return new Map(cache);
  }, [attachedFiles]);

  // Cleanup tất cả URLs khi component unmount
  useEffect(() => {
    return () => {
      for (const url of previewCacheRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      previewCacheRef.current.clear();
    };
  }, []);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResetAndClose = () => {
    setCurrentStep(1);
    setPoCode("");
    setCustomerPoCode("");
    setCustomerNameSnapshot("");
    setReceivedDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setAttachedFiles([]);
    setActiveCategory("other");
    setFileFilterCategory("all");
    setErrorMsg(null);
    onClose();
  };

  const validateStep1 = (): boolean => {
    setErrorMsg(null);
    if (!poCode.trim()) {
      setErrorMsg("Vui lòng nhập Mã PO hệ thống.");
      return false;
    }
    if (!customerNameSnapshot.trim()) {
      setErrorMsg("Vui lòng nhập Tên Khách hàng.");
      return false;
    }
    if (!receivedDate) {
      setErrorMsg("Vui lòng chọn Ngày nhận đơn hàng.");
      return false;
    }
    return true;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleAddFiles = useCallback((files: FileList | File[], forceCategory?: string) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const newItems: AttachedDocItem[] = list.map((file) => {
      const purpose = forceCategory || activeCategory || detectDocumentPurpose(file.name);
      return {
        file,
        purpose,
      };
    });

    setAttachedFiles((prev) => [...prev, ...newItems]);
  }, [activeCategory]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateFilePurpose = useCallback((index: number, newPurpose: string) => {
    setAttachedFiles((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, purpose: newPurpose } : item,
      ),
    );
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    try {
      await onSubmit(
        {
          poCode: poCode.trim(),
          customerPoCode: customerPoCode.trim() || undefined,
          customerNameSnapshot: customerNameSnapshot.trim(),
          receivedDate,
          note: note.trim() || undefined,
        },
        attachedFiles,
      );

      handleResetAndClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Có lỗi xảy ra khi tạo PO.");
      }
    }
  };

  // Đếm số lượng tệp theo từng danh mục (memoized)
  const categoryCounts = useMemo(
    () =>
      attachedFiles.reduce<Record<string, number>>((acc, item) => {
        acc[item.purpose] = (acc[item.purpose] || 0) + 1;
        return acc;
      }, {}),
    [attachedFiles],
  );

  const activeCategoryInfo = getDocumentCategoryInfo(activeCategory);

  // Danh sách tệp được lọc hiển thị (memoized)
  const filteredFiles = useMemo(
    () =>
      attachedFiles
        .map((item, originalIndex) => ({ item, originalIndex }))
        .filter(({ item }) => {
          if (fileFilterCategory === "all") return true;
          return item.purpose === fileFilterCategory;
        }),
    [attachedFiles, fileFilterCategory],
  );

  return (
    <Modal
      open={isOpen}
      onClose={handleResetAndClose}
      title="Tạo đơn hàng PO mới"
      size="lg"
    >
      <div className="space-y-6">
        {/* Stepper Wizard Indicator - Kích thước lớn, rõ ràng */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-b border-gray-200 pb-5 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3.5 rounded-2xl p-4 text-left transition-all cursor-pointer border ${
              currentStep === 1
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                currentStep === 1
                  ? "bg-brand-600 text-white shadow-sm"
                  : poCode && customerNameSnapshot
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {poCode && customerNameSnapshot && currentStep !== 1 ? "✓" : "1"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Giai đoạn 1: Thông tin chung</div>
              <div className="text-xs opacity-80 mt-0.5">
                Mã PO, Khách hàng, Ngày nhận & Ghi chú
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleNextToStep2}
            className={`flex items-center gap-3.5 rounded-2xl p-4 text-left transition-all cursor-pointer border ${
              currentStep === 2
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                currentStep === 2
                  ? "bg-brand-600 text-white shadow-sm"
                  : attachedFiles.length > 0
                    ? "bg-brand-500 text-white"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {attachedFiles.length > 0 && currentStep !== 2 ? (
                <span>{attachedFiles.length}</span>
              ) : (
                "2"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Giai đoạn 2: Phân loại tài liệu</div>
              <div className="text-xs opacity-80 mt-0.5">
                {attachedFiles.length > 0
                  ? `Đã chọn ${attachedFiles.length} tệp đính kèm`
                  : "Tải & phân loại tài liệu theo nhóm"}
              </div>
            </div>
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="rounded-xl border border-error-200 bg-error-50 p-3.5 text-sm font-medium text-error-700 dark:border-error-900/40 dark:bg-error-950/30 dark:text-error-300">
            {errorMsg}
          </div>
        )}

        {/* ======================= GIAI ĐOẠN 1: THÔNG TIN CHUNG ======================= */}
        {currentStep === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNextToStep2();
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Mã PO hệ thống <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={poCode}
                  onChange={(e) => setPoCode(e.target.value)}
                  placeholder="Ví dụ: PO-2026-001"
                  className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Mã PO Khách hàng (nếu có)
                </label>
                <input
                  type="text"
                  value={customerPoCode}
                  onChange={(e) => setCustomerPoCode(e.target.value)}
                  placeholder="Ví dụ: CUST-PO-99"
                  className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Tên Khách hàng <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerNameSnapshot}
                  onChange={(e) => setCustomerNameSnapshot(e.target.value)}
                  placeholder="Ví dụ: Tấn Minh Fashion"
                  className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Ngày nhận <span className="text-error-500">*</span>
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                Ghi chú đơn hàng
              </label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú thêm về đơn hàng (yêu cầu chất lượng, thời hạn giao hàng, quy cách đóng gói...)"
                className="w-full rounded-xl border border-gray-250 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="outline"
                size="md"
                onClick={handleResetAndClose}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button
                size="md"
                type="submit"
                disabled={isPending}
              >
                Tiếp tục: Thêm tài liệu →
              </Button>
            </div>
          </form>
        )}

        {/* ======================= GIAI ĐOẠN 2: PHÂN LOẠI TÀI LIỆU ======================= */}
        {currentStep === 2 && (
          <div className="space-y-5">
            {/* Tóm tắt nhanh thông tin PO từ Giai đoạn 1 */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 px-5 py-3.5 border border-gray-200 dark:bg-gray-800/50 dark:border-gray-700/60">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Mã PO: <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{poCode}</span>
                </span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-gray-600 dark:text-gray-300">
                  Khách hàng: <span className="font-semibold text-gray-900 dark:text-white">{customerNameSnapshot}</span>
                </span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-gray-600 dark:text-gray-300">
                  Ngày nhận: <span className="font-semibold text-gray-900 dark:text-white">{receivedDate}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer underline"
              >
                Chỉnh sửa thông tin
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Bộ chọn danh mục tài liệu (5 danh mục) - Gọn gàng, hiện đại */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Chọn danh mục tải lên:
                </label>
                {attachedFiles.length > 0 && (
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                    Tổng: {attachedFiles.length} tệp
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PO_DOCUMENT_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.key] || 0;
                  const isActive = activeCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategory(cat.key)}
                      className={`flex items-center sm:flex-col justify-between sm:justify-center gap-1.5 rounded-xl px-3 py-2 sm:py-2.5 text-center transition-all cursor-pointer border ${
                        isActive
                          ? "border-brand-500 bg-brand-50/90 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-500 font-bold shadow-xs ring-2 ring-brand-500/20"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <span className="text-xs font-bold">{cat.shortLabel}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isActive
                            ? "bg-brand-600 text-white dark:bg-brand-500"
                            : count > 0
                              ? "bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200"
                              : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {count} tệp
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Vùng tải tệp (Dropzone) - Thu gọn chiều cao khi đã có tệp để nhường chỗ cho danh sách */}
            {attachedFiles.length > 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed px-4 py-2.5 transition-all ${
                  isDragOver
                    ? "border-brand-500 bg-brand-50/80 dark:bg-brand-950/40"
                    : "border-brand-300 bg-brand-50/30 hover:border-brand-500 hover:bg-brand-50/60 dark:border-brand-800/60 dark:bg-brand-950/20 dark:hover:bg-brand-950/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/80 dark:text-brand-300">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-gray-800 dark:text-gray-200">
                      Tải thêm tệp vào mục:{" "}
                      <span className="text-brand-600 dark:text-brand-400 font-bold">
                        [{activeCategoryInfo.label}]
                      </span>
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      Nhấn hoặc kéo thả tệp mới vào đây
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-600 shadow-2xs border border-brand-200 dark:bg-gray-800 dark:border-brand-800 dark:text-brand-300">
                  + Chọn tệp
                </span>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-5 px-4 text-center transition-all ${
                  isDragOver
                    ? "border-brand-500 bg-brand-50/60 dark:bg-brand-950/30"
                    : "border-gray-300 bg-gray-50/50 hover:border-brand-500 hover:bg-white dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-brand-400 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400 mb-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Nhấn để tải hoặc kéo thả tệp vào danh mục{" "}
                  <span className="text-brand-600 dark:text-brand-400">
                    [{activeCategoryInfo.label}]
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {activeCategoryInfo.description} • Hỗ trợ nhiều tệp
                </p>
              </div>
            )}

            {/* Danh sách các tệp đã thêm - Mở rộng tối đa không gian */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900/60 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Danh sách tệp đính kèm ({attachedFiles.length})
                  </span>
                </div>

                {/* Bộ lọc xem nhanh theo danh mục */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-xs text-gray-400 mr-1">Xem:</span>
                  <button
                    type="button"
                    onClick={() => setFileFilterCategory("all")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                      fileFilterCategory === "all"
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    Tất cả ({attachedFiles.length})
                  </button>
                  {PO_DOCUMENT_CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat.key] || 0;
                    if (count === 0 && fileFilterCategory !== cat.key) return null;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setFileFilterCategory(cat.key)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                          fileFilterCategory === cat.key
                            ? "bg-brand-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {cat.shortLabel} ({count})
                      </button>
                    );
                  })}
                  {attachedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAttachedFiles([])}
                      className="ml-2 text-xs font-semibold text-error-500 hover:text-error-700 underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>
              </div>

              {/* Tệp list */}
              {filteredFiles.length > 0 ? (
                <div className="mt-3 max-h-80 sm:max-h-96 overflow-y-auto space-y-2 pr-1">
                  {filteredFiles.map(({ item, originalIndex }) => (
                    <FileRow
                      key={`${item.file.name}_${originalIndex}`}
                      item={item}
                      originalIndex={originalIndex}
                      previewUrl={previewUrls.get(item.file)}
                      onRemove={handleRemoveFile}
                      onUpdatePurpose={handleUpdateFilePurpose}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-400">
                  {attachedFiles.length === 0
                    ? "Chưa có tệp nào được đính kèm. Bạn có thể nhấn vào khung tải lên ở trên để thêm tệp hoặc tạo PO ngay."
                    : "Không có tệp nào trong danh mục đã chọn."}
                </div>
              )}

              {/* Tóm tắt các danh mục có tệp */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Phân bổ:
                  </span>
                  {PO_DOCUMENT_CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat.key] || 0;
                    if (count === 0) return null;
                    return (
                      <span
                        key={cat.key}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${cat.badgeClass}`}
                      >
                        {cat.shortLabel}: {count}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Buttons hoặc Upload Progress */}
            {uploadProgress && uploadProgress.total > 0 ? (
              /* ====== Upload Progress Overlay ====== */
              <div className="pt-5 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Animated spinner */}
                    <svg className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Đang tải tài liệu lên...
                    </span>
                  </div>
                  <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                    {Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500 ease-out"
                    style={{ width: `${Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%` }}
                  />
                  {/* Shimmer effect */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-white/20 animate-pulse"
                    style={{ width: `${Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%` }}
                  />
                </div>

                {/* Detail info */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {uploadProgress.currentFileName ? (
                      <>
                        Đang tải:{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {uploadProgress.currentFileName}
                        </span>
                      </>
                    ) : (
                      "Đang chuẩn bị..."
                    )}
                  </span>
                  <span className="font-mono font-semibold">
                    {uploadProgress.completed}/{uploadProgress.total} tệp
                  </span>
                </div>
              </div>
            ) : (
              /* ====== Normal Footer Buttons ====== */
              <div className="flex items-center justify-between pt-5 border-t border-gray-200 dark:border-gray-800">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setCurrentStep(1)}
                  disabled={isPending}
                >
                  ← Quay lại Thông tin chung
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleResetAndClose}
                    disabled={isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="md"
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isPending}
                  >
                    {isPending ? "Đang tạo PO..." : "Hoàn tất & Tạo PO mới"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
