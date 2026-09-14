import { useRef, useState } from "react";
import { Modal, Button, FileTypeIcon } from "@/components/shared";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { PO_DOCUMENT_CATEGORIES, getDocumentCategoryInfo } from "@/lib/poDocuments";
import { PoDocumentCategoryPicker } from "./PoDocumentCategoryPicker";
import type { AttachedDocItem } from "@/types/po";

interface Props {
  isOpen: boolean;
  isPending: boolean;
  /** Giao cả lô cho trang chạy nền; modal không chờ kết quả. */
  onStartUpload: (filesByPurpose: Record<string, File[]>) => void;
  onClose: () => void;
}

/** Khóa nhận dạng một tệp đã chọn; File không có id nên ghép tên+cỡ+thời điểm. */
function fileKey(file: File): string {
  return `${file.name}_${file.size}_${file.lastModified}`;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Tải tài liệu lên PO.
 *
 * Dùng lại đúng bố cục bước "Thêm tệp" của modal tạo PO: một dải danh mục vừa
 * lọc danh sách vừa quyết định danh mục của tệp mới thêm, rồi tới vùng kéo thả,
 * rồi danh sách tệp chờ. Trước đây khu vực này nằm thẳng trong tab Tài liệu với
 * một công tắc "1./2." riêng — hai màn cùng làm một việc mà trông khác hẳn nhau.
 */
export function PoUploadDocumentsModal({
  isOpen,
  isPending,
  onStartUpload,
  onClose,
}: Props) {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [attachedFiles, setAttachedFiles] = useState<AttachedDocItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryCounts = attachedFiles.reduce<Record<string, number>>(
    (acc, item) => {
      acc[item.purpose] = (acc[item.purpose] || 0) + 1;
      return acc;
    },
    {},
  );

  const visibleFiles =
    selectedTab === "all"
      ? attachedFiles
      : attachedFiles.filter((item) => item.purpose === selectedTab);

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    // Tệp thêm khi đang đứng ở "Tất cả" thì chưa phân loại -> xếp vào "Khác".
    const purpose = selectedTab === "all" ? "other" : selectedTab;
    setAttachedFiles((prev) => {
      const seen = new Set(prev.map((i) => fileKey(i.file)));
      const additions = list
        .filter((f) => !seen.has(fileKey(f)))
        .map((file) => ({ file, purpose }));
      return [...prev, ...additions];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    setAttachedFiles([]);
    setSelectedTab("all");
    onClose();
  };

  // Không await: giao cho trang chạy nền rồi đóng modal ngay.
  const handleUpload = () => {
    if (attachedFiles.length === 0) return;

    const byPurpose = attachedFiles.reduce<Record<string, File[]>>(
      (acc, item) => {
        (acc[item.purpose] ||= []).push(item.file);
        return acc;
      },
      {},
    );

    onStartUpload(byPurpose);
    setAttachedFiles([]);
    setSelectedTab("all");
    onClose();
  };

  const busy = isPending;
  const totalSize = attachedFiles.reduce((sum, i) => sum + i.file.size, 0);

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Tải tài liệu lên đơn hàng PO"
      size="xl"
    >
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-theme-sm font-bold text-gray-700 dark:text-gray-300">
              Danh mục tài liệu
            </label>
            {attachedFiles.length > 0 && (
              <span className="text-theme-xs font-semibold text-brand-600 dark:text-brand-400">
                Tổng: {attachedFiles.length} tệp · {formatBytes(totalSize)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTab("all")}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-theme-sm font-bold transition cursor-pointer ${
                selectedTab === "all"
                  ? "border-brand-300 bg-brand-50 text-brand-700 shadow-xs dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                  : "border-gray-200 bg-white font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              Tất cả
              <span
                className={`rounded-full px-2 py-0.5 text-theme-xs font-bold ${
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
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-theme-sm font-bold transition cursor-pointer ${
                    isActive
                      ? "border-brand-300 bg-brand-50 text-brand-700 shadow-xs dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300"
                      : "border-gray-200 bg-white font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {cat.shortLabel}
                  {count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-theme-xs font-bold ${
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

        {attachedFiles.length > 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed px-4 py-3 transition-all ${
              isDragOver
                ? "border-brand-500 bg-brand-50/80 dark:bg-brand-950/40"
                : "border-brand-300 bg-brand-50/30 hover:border-brand-500 hover:bg-brand-50/60 dark:border-brand-800/60 dark:bg-brand-950/20 dark:hover:bg-brand-950/40"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/80 dark:text-brand-300">
                <PlusIcon className="h-4 w-4" />
              </div>
              <p className="truncate text-theme-sm font-semibold text-gray-700 dark:text-gray-200">
                {selectedTab === "all" ? (
                  "Kéo thả hoặc nhấn để thêm tệp"
                ) : (
                  <>
                    Kéo thả hoặc nhấn để thêm tệp vào{" "}
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {getDocumentCategoryInfo(selectedTab).label}
                    </span>
                  </>
                )}
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-theme-xs font-bold text-brand-600 shadow-2xs dark:border-brand-800 dark:bg-gray-800 dark:text-brand-300">
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
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all ${
              isDragOver
                ? "border-brand-500 bg-brand-50/60 dark:bg-brand-950/30"
                : "border-gray-300 bg-gray-50/50 hover:border-brand-500 hover:bg-white dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-brand-400 dark:hover:bg-gray-800"
            }`}
          >
            <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/80 dark:text-brand-300">
              <PlusIcon className="h-5 w-5" />
            </div>
            <p className="text-theme-sm font-bold text-gray-700 dark:text-gray-200">
              {selectedTab === "all" ? (
                "Kéo thả hoặc nhấn để thêm tệp"
              ) : (
                <>
                  Kéo thả hoặc nhấn để thêm tệp vào{" "}
                  <span className="font-bold text-brand-600 dark:text-brand-400">
                    {getDocumentCategoryInfo(selectedTab).label}
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900/60">
          <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
            <h4 className="text-theme-sm font-bold text-gray-900 dark:text-white">
              Danh sách tệp đính kèm
            </h4>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-theme-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {visibleFiles.length}
            </span>
          </div>

          {visibleFiles.length === 0 ? (
            <p className="py-6 text-center text-theme-xs text-gray-400 dark:text-gray-500">
              {attachedFiles.length === 0
                ? "Chưa có tệp nào. Nhấn vào khung phía trên để chọn tệp."
                : "Không có tệp nào trong danh mục này."}
            </p>
          ) : (
            <ul className="space-y-2">
              {visibleFiles.map((item) => {
                const key = fileKey(item.file);
                return (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-800/40"
                  >
                    <FileTypeIcon fileName={item.file.name} className="h-8 w-8 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-theme-sm font-semibold text-gray-900 dark:text-white">
                        {item.file.name}
                      </p>
                      <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                        {formatBytes(item.file.size)}
                      </p>
                    </div>
                    <PoDocumentCategoryPicker
                      value={item.purpose}
                      disabled={busy}
                      align="right"
                      onChange={(newPurpose) =>
                        setAttachedFiles((prev) =>
                          prev.map((f) =>
                            fileKey(f.file) === key
                              ? { ...f, purpose: newPurpose }
                              : f,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAttachedFiles((prev) =>
                          prev.filter((f) => fileKey(f.file) !== key),
                        )
                      }
                      disabled={busy}
                      title="Bỏ tệp này"
                      className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-error-950/40 dark:hover:text-error-400"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={attachedFiles.length === 0 || busy}
          >
            {`Tải lên ${attachedFiles.length || ""} tệp`.replace("  ", " ")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
