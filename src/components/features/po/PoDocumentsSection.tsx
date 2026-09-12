import { useState, useRef } from "react";
import { Button, FileTypeIcon } from "@/components/shared";
import { FileIcon, DownloadIcon, TrashBinIcon, EyeIcon, CloseLineIcon, AngleDownIcon } from "@/icons";
import type { PurchaseOrderDocumentItem } from "@/types/po";

interface Props {
  poId?: string;
  documents: PurchaseOrderDocumentItem[];
  isLocked: boolean;
  isPending: boolean;
  onUpload: (files: File[] | File, purpose: string) => Promise<void>;
  onUnlink: (documentId: string) => Promise<void>;
  onUpdatePurpose?: (documentId: string, purpose: string) => Promise<void>;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

import { PO_DOCUMENT_CATEGORIES, getDocumentCategoryInfo } from "@/lib/poDocuments";

export function PoDocumentsSection({
  documents,
  isLocked,
  isPending,
  onUpload,
  onUnlink,
  onUpdatePurpose,
}: Props) {
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("po_original");
  const [uploadMode, setUploadMode] = useState<"common" | "categorized">("common");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryCounts = documents.reduce<Record<string, number>>((acc, doc) => {
    const norm = doc.purpose === "techpack" ? "tech_pack" : doc.purpose;
    acc[norm] = (acc[norm] || 0) + 1;
    return acc;
  }, {});

  const filteredDocuments = documents.filter((doc) => {
    if (activeCategoryTab === "all") return true;
    const norm = doc.purpose === "techpack" ? "tech_pack" : doc.purpose;
    return norm === activeCategoryTab;
  });

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    setSelectedFiles((prev) => {
      const existingKeys = new Set(
        prev.map((f) => `${f.name}_${f.size}_${f.lastModified}`),
      );
      const newAdditions = list.filter(
        (f) => !existingKeys.has(`${f.name}_${f.size}_${f.lastModified}`),
      );
      return [...prev, ...newAdditions];
    });
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleExecuteUpload = async () => {
    if (selectedFiles.length === 0) return;
    try {
      setUploading(true);
      const targetPurpose = uploadMode === "common" ? "other" : purpose;
      await onUpload(selectedFiles, targetPurpose);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  const handleCategoryChange = async (documentId: string, newPurpose: string) => {
    if (!onUpdatePurpose) return;
    setUpdatingDocId(documentId);
    try {
      await onUpdatePurpose(documentId, newPurpose);
    } finally {
      setUpdatingDocId(null);
    }
  };

  const totalSelectedSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-5">
      {/* Upload Zone (Only when not locked) */}
      {!isLocked && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-theme-base font-bold text-gray-900 dark:text-white">
                Thêm tài liệu
              </h4>
            </div>

            {/* 2 Lựa chọn rõ ràng: 1. Chung | 2. Phân loại */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setUploadMode("common");
                  setPurpose("other");
                }}
                className={`flex items-center justify-center rounded-lg px-3 py-1.5 text-theme-xs font-bold transition-all cursor-pointer ${
                  uploadMode === "common"
                    ? "bg-white text-gray-900 shadow-2xs dark:bg-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                1. Tải tệp chung
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("categorized")}
                className={`flex items-center justify-center rounded-lg px-3 py-1.5 text-theme-xs font-bold transition-all cursor-pointer ${
                  uploadMode === "categorized"
                    ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-900 dark:text-brand-400"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                2. Phân loại
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {/* Nếu là chế độ phân loại: hiển thị 5 nút danh mục */}
            {uploadMode === "categorized" && (
              <div>
                <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Chọn danh mục:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PO_DOCUMENT_CATEGORIES.map((cat) => {
                    const isActive = purpose === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setPurpose(cat.key)}
                        className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-theme-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? `${cat.tabActiveClass} font-bold shadow-xs`
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                {uploadMode === "categorized" && (
                  <label className="block text-theme-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tệp đính kèm vào:{" "}
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {getDocumentCategoryInfo(purpose).label}
                    </span>
                  </label>
                )}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-1 flex cursor-pointer items-center justify-between rounded-xl border border-dashed px-4 py-2.5 transition-colors ${
                    dragOver
                      ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/20"
                      : "border-gray-300 bg-gray-50/50 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="truncate text-theme-sm text-gray-600 dark:text-gray-300">
                    {selectedFiles.length > 0 ? (
                      <span className="font-semibold text-brand-600 dark:text-brand-400">
                        Đã chọn {selectedFiles.length} tệp ({formatBytes(totalSelectedSize)}) - Bấm để chọn thêm
                      </span>
                    ) : (
                      "Kéo thả hoặc chọn tệp..."
                    )}
                  </span>
                  <span className="shrink-0 text-theme-xs font-medium text-brand-600 dark:text-brand-400">
                    + Thêm tệp
                  </span>
                </div>
              </div>

              <div className="sm:self-end">
                <Button
                  size="sm"
                  onClick={() => void handleExecuteUpload()}
                  disabled={selectedFiles.length === 0 || uploading || isPending}
                >
                  {uploading
                    ? `Đang tải lên (${selectedFiles.length})...`
                    : selectedFiles.length > 1
                      ? `Tải lên ${selectedFiles.length} tệp`
                      : "Tải lên"}
                </Button>
              </div>
            </div>

            {/* Selected files chips list */}
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50/80 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 animate-in fade-in duration-150">
                <span className="text-theme-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">
                  Tệp chờ tải lên ({selectedFiles.length}):
                </span>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}_${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-theme-xs font-medium text-gray-800 shadow-2xs border border-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
                  >
                    <FileTypeIcon fileName={file.name} size="xs" />
                    <span className="max-w-xs truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      ({formatBytes(file.size)})
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelectedFile(idx);
                      }}
                      className="ml-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded p-0.5 transition-colors cursor-pointer"
                      title="Bỏ tệp này"
                    >
                      <CloseLineIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFiles([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-theme-xs text-red-500 hover:text-red-700 underline font-medium ml-2 cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents List Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <div>
            <h3 className="text-theme-base font-bold text-gray-900 dark:text-white">
              Danh sách tài liệu đính kèm ({documents.length})
            </h3>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {documents.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/40">
            <button
              type="button"
              onClick={() => setActiveCategoryTab("all")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-theme-xs font-semibold transition cursor-pointer ${
                activeCategoryTab === "all"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                  activeCategoryTab === "all"
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {documents.length}
              </span>
            </button>

            {PO_DOCUMENT_CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.key] || 0;
              const isActive = activeCategoryTab === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategoryTab(cat.key)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-theme-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? cat.tabActiveClass
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                  }`}
                >
                  <span>{cat.shortLabel}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                      isActive
                        ? "bg-white/20 text-white"
                        : count > 0
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-bold"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-700/60 dark:text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <FileIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mt-3 text-theme-base font-semibold text-gray-900 dark:text-white">
              Chưa có tài liệu nào được đính kèm.
            </p>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              {!isLocked
                ? "Sử dụng khung tải lên ở trên để đính kèm tệp tài liệu vào đơn hàng PO này."
                : "Đơn hàng đã khóa, không có tài liệu đính kèm."}
            </p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <FileIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mt-3 text-theme-base font-semibold text-gray-900 dark:text-white">
              Chưa có tài liệu nào thuộc danh mục {getDocumentCategoryInfo(activeCategoryTab).label}.
            </p>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              Bạn có thể sử dụng khung tải lên ở trên để đính kèm thêm tài liệu cho danh mục này.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategoryTab("all")}
              className="mt-4 inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-theme-xs font-semibold text-brand-600 shadow-2xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-brand-400 cursor-pointer"
            >
              ← Xem tất cả tài liệu ({documents.length})
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-theme-sm text-gray-700 dark:text-gray-300">
              <thead className="border-b border-gray-200 bg-gray-50/80 text-theme-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3.5">Tên tài liệu / Tệp</th>
                  <th className="px-5 py-3.5">Phân loại</th>
                  <th className="px-5 py-3.5">Kích thước</th>
                  <th className="px-5 py-3.5">Ngày đính kèm</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredDocuments.map((doc) => {
                  const catInfo = getDocumentCategoryInfo(doc.purpose);
                  // fileUrl is always a full presigned S3 URL, resolved fresh
                  // by the server on every response — never persisted.
                  const fullUrl = doc.fileUrl || null;

                  return (
                    <tr
                      key={doc.documentId}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <FileTypeIcon fileName={doc.fileName || doc.title} size="md" />
                          <div className="min-w-0">
                            <span className="block truncate max-w-md font-semibold text-gray-900 dark:text-white">
                              {doc.fileName || doc.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isLocked || !onUpdatePurpose ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-semibold border ${catInfo.badgeClass}`}
                          >
                            {catInfo.shortLabel}
                          </span>
                        ) : (
                          <div className="relative inline-flex items-center">
                            <select
                              value={doc.purpose}
                              onChange={(e) => {
                                const newPurpose = e.target.value;
                                if (newPurpose !== doc.purpose) {
                                  void handleCategoryChange(doc.documentId, newPurpose);
                                }
                              }}
                              disabled={isPending || updatingDocId === doc.documentId}
                              className={`appearance-none cursor-pointer rounded-full pl-3 pr-7 py-1 text-theme-xs font-semibold border transition-all shadow-2xs hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${catInfo.badgeClass}`}
                              title="Bấm để thay đổi phân loại tệp"
                            >
                              {PO_DOCUMENT_CATEGORIES.map((cat) => (
                                <option
                                  key={cat.key}
                                  value={cat.key}
                                  className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white font-normal"
                                >
                                  {cat.label}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-2 text-current opacity-60">
                              <AngleDownIcon className="h-3 w-3" />
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono text-theme-xs text-gray-500 dark:text-gray-400">
                        {formatBytes(doc.fileSize)}
                      </td>
                      <td className="px-5 py-4 text-theme-xs text-gray-500 dark:text-gray-400">
                        {formatDate(doc.linkedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {fullUrl && (
                            <>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-theme-xs font-medium text-brand-700 shadow-xs hover:bg-brand-100 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50 transition-colors"
                                title="Xem tài liệu"
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                                Xem
                              </a>
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={doc.fileName || doc.title}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-theme-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title="Tải về tệp"
                              >
                                <DownloadIcon className="h-3.5 w-3.5" />
                                Tải về
                              </a>
                            </>
                          )}
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => void onUnlink(doc.documentId)}
                              disabled={isPending}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950/40 dark:hover:text-error-400 transition-colors"
                              title="Gỡ tài liệu khỏi PO"
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
