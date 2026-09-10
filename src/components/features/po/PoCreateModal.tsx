import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Modal, Button, FileTypeIcon, ConfirmDialog } from "@/components/shared";
import {
  CloseLineIcon,
  CheckLineIcon,
  PencilIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@/icons";
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
  // Giai đoạn tạo PO: 1 = Thông tin chung, 2 = Thêm tệp, 3 = Xác nhận & tạo
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Dữ liệu giai đoạn 1 (Thông tin chung)
  const [poCode, setPoCode] = useState("");
  const [customerPoCode, setCustomerPoCode] = useState("");
  const [customerNameSnapshot, setCustomerNameSnapshot] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");

  // Dữ liệu giai đoạn 2 (Tài liệu đính kèm)
  // Một tab danh mục duy nhất: vừa lọc danh sách hiển thị, vừa quyết định
  // danh mục gán cho tệp mới tải lên (chọn "Tất cả" thì hệ thống tự nhận diện theo tên tệp).
  const [attachedFiles, setAttachedFiles] = useState<AttachedDocItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showFileDetails, setShowFileDetails] = useState(false);

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
    const previewCache = previewCacheRef.current;
    return () => {
      for (const url of previewCache.values()) {
        URL.revokeObjectURL(url);
      }
      previewCache.clear();
    };
  }, []);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    poCode?: string;
    customerNameSnapshot?: string;
    receivedDate?: string;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const poCodeInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const receivedDateInputRef = useRef<HTMLInputElement>(null);

  const handleResetAndClose = () => {
    setCurrentStep(1);
    setPoCode("");
    setCustomerPoCode("");
    setCustomerNameSnapshot("");
    setReceivedDate(new Date().toISOString().split("T")[0]);
    setNote("");
    setAttachedFiles([]);
    setSelectedTab("all");
    setShowDeleteAllConfirm(false);
    setShowFileDetails(false);
    setErrorMsg(null);
    setFieldErrors({});
    onClose();
  };

  const validateStep1 = (): boolean => {
    setErrorMsg(null);

    const errors: typeof fieldErrors = {};
    if (!poCode.trim()) errors.poCode = "Vui lòng nhập Mã PO hệ thống.";
    if (!customerNameSnapshot.trim())
      errors.customerNameSnapshot = "Vui lòng nhập Tên khách hàng.";
    if (!receivedDate) errors.receivedDate = "Vui lòng chọn ngày nhận.";

    setFieldErrors(errors);

    if (errors.poCode) {
      poCodeInputRef.current?.focus();
    } else if (errors.customerNameSnapshot) {
      customerNameInputRef.current?.focus();
    } else if (errors.receivedDate) {
      receivedDateInputRef.current?.focus();
    }

    return Object.keys(errors).length === 0;
  };

  const handleNextToStep2 = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleNextToStep3 = () => {
    if (validateStep1()) {
      setCurrentStep(3);
    }
  };

  const handleAddFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const newItems: AttachedDocItem[] = list.map((file) => {
      const purpose =
        selectedTab === "all" ? detectDocumentPurpose(file.name) : selectedTab;
      return {
        file,
        purpose,
      };
    });

    setAttachedFiles((prev) => [...prev, ...newItems]);
  }, [selectedTab]);

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

  // Danh sách tệp được lọc hiển thị theo tab đang chọn (memoized)
  const filteredFiles = useMemo(
    () =>
      attachedFiles
        .map((item, originalIndex) => ({ item, originalIndex }))
        .filter(({ item }) => selectedTab === "all" || item.purpose === selectedTab),
    [attachedFiles, selectedTab],
  );

  return (
    <Modal
      open={isOpen}
      onClose={handleResetAndClose}
      title="Tạo đơn hàng PO mới"
      size="lg"
    >
      <div className="space-y-6">
        {/* Stepper Wizard Indicator - 3 bước, to rõ, dùng chung 1 tông xanh brand */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 border-b border-gray-200 pb-5 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all cursor-pointer border ${
              currentStep === 1
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                currentStep === 1
                  ? "bg-brand-600 text-white shadow-sm"
                  : poCode && customerNameSnapshot
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {poCode && customerNameSnapshot && currentStep !== 1 ? (
                <CheckLineIcon className="h-3.5 w-3.5" />
              ) : (
                "1"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Thông tin chung</div>
              <div className="text-xs opacity-80 mt-0.5 truncate">
                Mã PO, khách hàng, ngày nhận
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleNextToStep2}
            className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all cursor-pointer border ${
              currentStep === 2
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                currentStep === 2
                  ? "bg-brand-600 text-white shadow-sm"
                  : currentStep === 3
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {currentStep === 3 ? (
                <CheckLineIcon className="h-3.5 w-3.5" />
              ) : (
                "2"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Thêm tệp</div>
              <div className="text-xs opacity-80 mt-0.5 truncate">
                {attachedFiles.length > 0
                  ? `Đã chọn ${attachedFiles.length} tệp`
                  : "Không bắt buộc"}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleNextToStep3}
            className={`flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all cursor-pointer border ${
              currentStep === 3
                ? "bg-brand-50/90 border-brand-300 text-brand-700 shadow-sm dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100 hover:border-gray-300 text-gray-600 dark:bg-gray-800/60 dark:border-gray-800 dark:hover:bg-gray-800 dark:text-gray-400"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                currentStep === 3
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              3
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">Xác nhận</div>
              <div className="text-xs opacity-80 mt-0.5 truncate">
                Kiểm tra & tạo PO
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
                  ref={poCodeInputRef}
                  type="text"
                  value={poCode}
                  onChange={(e) => {
                    setPoCode(e.target.value);
                    if (fieldErrors.poCode) setFieldErrors((prev) => ({ ...prev, poCode: undefined }));
                  }}
                  placeholder="Ví dụ: PO-2026-001"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-800 dark:text-white ${
                    fieldErrors.poCode
                      ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                      : "border-gray-250 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-800"
                  }`}
                  autoFocus
                />
                {fieldErrors.poCode && (
                  <p className="mt-1.5 text-xs font-medium text-error-600 dark:text-error-400">
                    {fieldErrors.poCode}
                  </p>
                )}
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
                  ref={customerNameInputRef}
                  type="text"
                  value={customerNameSnapshot}
                  onChange={(e) => {
                    setCustomerNameSnapshot(e.target.value);
                    if (fieldErrors.customerNameSnapshot)
                      setFieldErrors((prev) => ({ ...prev, customerNameSnapshot: undefined }));
                  }}
                  placeholder="Ví dụ: Tấn Minh Fashion"
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-800 dark:text-white ${
                    fieldErrors.customerNameSnapshot
                      ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                      : "border-gray-250 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-800"
                  }`}
                />
                {fieldErrors.customerNameSnapshot && (
                  <p className="mt-1.5 text-xs font-medium text-error-600 dark:text-error-400">
                    {fieldErrors.customerNameSnapshot}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                  Ngày nhận <span className="text-error-500">*</span>
                </label>
                <input
                  ref={receivedDateInputRef}
                  type="date"
                  value={receivedDate}
                  onChange={(e) => {
                    setReceivedDate(e.target.value);
                    if (fieldErrors.receivedDate)
                      setFieldErrors((prev) => ({ ...prev, receivedDate: undefined }));
                  }}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-800 dark:text-white ${
                    fieldErrors.receivedDate
                      ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                      : "border-gray-250 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-800"
                  }`}
                />
                {fieldErrors.receivedDate && (
                  <p className="mt-1.5 text-xs font-medium text-error-600 dark:text-error-400">
                    {fieldErrors.receivedDate}
                  </p>
                )}
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

        {/* ======================= GIAI ĐOẠN 2: THÊM TỆP ======================= */}
        {currentStep === 2 && (
          <div className="space-y-5">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Danh mục tài liệu: 1 dải tab duy nhất — vừa lọc danh sách bên dưới,
                vừa quyết định danh mục của tệp mới tải lên (thay cho 3 khu vực tách rời trước đây) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Danh mục tài liệu
                </label>
                {attachedFiles.length > 0 && (
                  <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                    Tổng: {attachedFiles.length} tệp
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTab("all")}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition cursor-pointer border ${
                    selectedTab === "all"
                      ? "border-brand-300 bg-brand-50 text-brand-700 shadow-xs dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                      : "border-gray-200 bg-white text-gray-600 font-semibold hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  Tất cả
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      selectedTab === "all"
                        ? "bg-brand-600 text-white"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {attachedFiles.length}
                  </span>
                </button>
                {PO_DOCUMENT_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.key] || 0;
                  const isActive = selectedTab === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setSelectedTab(cat.key)}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition cursor-pointer border ${
                        isActive
                          ? "border-brand-300 bg-brand-50 text-brand-700 shadow-xs dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                          : "border-gray-200 bg-white text-gray-600 font-semibold hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {cat.shortLabel}
                      {count > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            isActive
                              ? "bg-brand-600 text-white"
                              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {count}
                        </span>
                      )}
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
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-all ${
                  isDragOver
                    ? "border-brand-500 bg-brand-50/80 dark:bg-brand-950/40"
                    : "border-brand-300 bg-brand-50/30 hover:border-brand-500 hover:bg-brand-50/60 dark:border-brand-800/60 dark:bg-brand-950/20 dark:hover:bg-brand-950/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/80 dark:text-brand-300">
                    <PlusIcon className="h-4 w-4" />
                  </div>
                  <p className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {selectedTab === "all" ? (
                      "Kéo thả hoặc nhấn để thêm tệp"
                    ) : (
                      <>
                        Kéo thả hoặc nhấn để thêm tệp vào{" "}
                        <span className="text-brand-600 dark:text-brand-400 font-bold">
                          {getDocumentCategoryInfo(selectedTab).label}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <span className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-600 shadow-2xs border border-brand-200 dark:bg-gray-800 dark:border-brand-800 dark:text-brand-300">
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
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/80 dark:text-brand-300 mb-2.5">
                  <PlusIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {selectedTab === "all" ? (
                    "Kéo thả hoặc nhấn để thêm tệp"
                  ) : (
                    <>
                      Kéo thả hoặc nhấn để thêm tệp vào{" "}
                      <span className="text-brand-600 dark:text-brand-400 font-bold">
                        {getDocumentCategoryInfo(selectedTab).label}
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Danh sách các tệp đã thêm - Mở rộng tối đa không gian */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900/60 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Danh sách tệp đính kèm
                  </span>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {filteredFiles.length}
                  </span>
                </div>
                {attachedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="text-xs font-semibold text-error-500 hover:text-error-700 underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
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
            </div>

            <ConfirmDialog
              open={showDeleteAllConfirm}
              title="Xóa tất cả tệp đính kèm?"
              description={`Toàn bộ ${attachedFiles.length} tệp bạn đã chọn ở bước này sẽ bị gỡ khỏi danh sách. Hành động này không thể hoàn tác.`}
              confirmLabel="Xóa tất cả"
              variant="danger"
              onConfirm={() => {
                setAttachedFiles([]);
                setShowDeleteAllConfirm(false);
              }}
              onClose={() => setShowDeleteAllConfirm(false)}
            />

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-5 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(1)}
              >
                ← Quay lại
              </Button>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="md" onClick={handleResetAndClose}>
                  Hủy
                </Button>
                <Button size="md" type="button" onClick={handleNextToStep3}>
                  Tiếp tục: Xác nhận →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================= GIAI ĐOẠN 3: XÁC NHẬN & TẠO PO ======================= */}
        {currentStep === 3 && (
          <div className="space-y-5">
            {/* Thẻ tóm tắt thông tin chung */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Thông tin đơn hàng
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                >
                  <PencilIcon className="h-4 w-4" />
                  Sửa
                </button>
              </div>
              <dl className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Mã PO
                  </dt>
                  <dd className="mt-0.5 font-mono text-base font-bold text-gray-900 dark:text-white">
                    {poCode}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Khách hàng
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
                    {customerNameSnapshot}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Ngày nhận
                  </dt>
                  <dd className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
                    {receivedDate}
                  </dd>
                </div>
                {customerPoCode && (
                  <div>
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Mã PO khách hàng
                    </dt>
                    <dd className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
                      {customerPoCode}
                    </dd>
                  </div>
                )}
                {note && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Ghi chú
                    </dt>
                    <dd className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {note}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Thẻ tóm tắt tệp đính kèm */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Tệp đính kèm
                </h3>
                <div className="flex items-center gap-4">
                  {attachedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowFileDetails((v) => !v)}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
                    >
                      {showFileDetails ? "Thu gọn" : "Xem chi tiết"}
                      {showFileDetails ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Sửa
                  </button>
                </div>
              </div>
              {attachedFiles.length > 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-bold text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
                      Tổng: {attachedFiles.length} tệp
                    </span>
                    {PO_DOCUMENT_CATEGORIES.map((cat) => {
                      const count = categoryCounts[cat.key] || 0;
                      if (count === 0) return null;
                      return (
                        <span
                          key={cat.key}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border ${cat.badgeClass}`}
                        >
                          {cat.shortLabel}: {count}
                        </span>
                      );
                    })}
                  </div>

                  {showFileDetails && (
                    <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1 border-t border-gray-100 dark:border-gray-800 pt-4">
                      {attachedFiles.map((item, index) => (
                        <FileRow
                          key={`${item.file.name}_${index}`}
                          item={item}
                          originalIndex={index}
                          previewUrl={previewUrls.get(item.file)}
                          onRemove={handleRemoveFile}
                          onUpdatePurpose={handleUpdateFilePurpose}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  Chưa đính kèm tệp nào. Bạn vẫn có thể tạo PO và bổ sung tệp sau.
                </p>
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
                  onClick={() => setCurrentStep(2)}
                  disabled={isPending}
                >
                  ← Quay lại
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
                    {isPending ? "Đang tạo PO..." : "✓ Xác nhận & Tạo PO"}
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
