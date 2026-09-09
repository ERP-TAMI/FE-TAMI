import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, Modal, FileTypeIcon } from "@/components/shared";
import { FileIcon, DownloadIcon, TrashBinIcon, EyeIcon, CloseLineIcon, AngleDownIcon } from "@/icons";
import { poApi } from "@/api/po.api";
import type { PurchaseOrderDocumentItem, PoDocumentPreviewResponse } from "@/types/po";

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

import {
  PO_DOCUMENT_CATEGORIES,
  getDocumentCategoryInfo,
  getPurposeLabel,
} from "@/lib/poDocuments";

function getFileType(
  fileName: string | null | undefined,
): "image" | "pdf" | "excel" | "word" | "text" | "unsupported" {
  if (!fileName) return "unsupported";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "")) return "image";
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext || "")) return "excel";
  if (["docx", "doc"].includes(ext || "")) return "word";
  if (["txt", "json", "md"].includes(ext || "")) return "text";
  return "unsupported";
}

export function PoDocumentsSection({
  poId,
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
  const [previewDoc, setPreviewDoc] = useState<PurchaseOrderDocumentItem | null>(null);
  const [previewData, setPreviewData] = useState<PoDocumentPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
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

  // Close zoomed image with Escape without closing parent preview modal
  useEffect(() => {
    if (!zoomedImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.preventDefault();
        setZoomedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [zoomedImage]);

  useEffect(() => {
    if (!previewDoc) {
      setPreviewData(null);
      return;
    }
    setActiveSheetIdx(0);

    if (!poId) {
      setPreviewData({
        type: getFileType(previewDoc.fileName || previewDoc.title),
        fileName: previewDoc.fileName || previewDoc.title,
        fileUrl: previewDoc.fileUrl || undefined,
      });
      return;
    }

    let isMounted = true;
    setLoadingPreview(true);

    poApi
      .previewDocument(poId, previewDoc.documentId)
      .then((res) => {
        if (isMounted) setPreviewData(res);
      })
      .catch((err) => {
        console.error("Lỗi khi tải dữ liệu xem trước:", err);
        if (isMounted) {
          setPreviewData({
            type: getFileType(previewDoc.fileName || previewDoc.title),
            fileName: previewDoc.fileName || previewDoc.title,
            fileUrl: previewDoc.fileUrl || undefined,
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingPreview(false);
      });

    return () => {
      isMounted = false;
    };
  }, [previewDoc, poId]);

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
                  const fullUrl = doc.fileUrl
                    ? doc.fileUrl.startsWith("http")
                      ? doc.fileUrl
                      : `http://localhost:3000${doc.fileUrl}`
                    : null;

                  return (
                    <tr
                      key={doc.documentId}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="cursor-pointer focus:outline-none"
                            title={`Xem trước ${doc.fileName || doc.title}`}
                          >
                            <FileTypeIcon
                              fileName={doc.fileName || doc.title}
                              size="md"
                              withHover
                            />
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="text-left font-semibold text-gray-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400 transition-colors cursor-pointer block truncate max-w-md"
                              title="Bấm để xem trước"
                            >
                              {doc.fileName || doc.title}
                            </button>
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
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-theme-xs font-medium text-brand-700 shadow-xs hover:bg-brand-100 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50 transition-colors cursor-pointer"
                                title="Xem trước tài liệu"
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                                Xem trước
                              </button>
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

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          open={!!previewDoc}
          title={`Xem trước: ${previewDoc.fileName || previewDoc.title}`}
          size="2xl"
          onClose={() => setPreviewDoc(null)}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-theme-xs text-gray-500 font-mono">
                {formatBytes(previewDoc.fileSize)} • {getPurposeLabel(previewDoc.purpose)}
              </span>
              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && (
                  <a
                    href={
                      previewDoc.fileUrl.startsWith("http")
                        ? previewDoc.fileUrl
                        : previewDoc.fileUrl.startsWith("/")
                          ? previewDoc.fileUrl
                          : `/${previewDoc.fileUrl}`
                    }
                    download={previewDoc.fileName || previewDoc.title}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-theme-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition shadow-xs"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Tải về máy
                  </a>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewDoc(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          }
        >
          {loadingPreview ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mb-3" />
              <p className="text-theme-sm font-medium">Đang nạp dữ liệu xem trước tài liệu...</p>
            </div>
          ) : (() => {
            const fileType = previewData?.type || getFileType(previewDoc.fileName || previewDoc.title);
            const docUrl = previewDoc.fileUrl
              ? previewDoc.fileUrl.startsWith("http")
                ? previewDoc.fileUrl
                : previewDoc.fileUrl.startsWith("/")
                  ? previewDoc.fileUrl
                  : `/${previewDoc.fileUrl}`
              : null;

            if (fileType === "excel" && previewData?.sheets && previewData.sheets.length > 0) {
              const currentSheet = previewData.sheets[activeSheetIdx] || previewData.sheets[0];

              return (
                <div className="space-y-3">
                  {/* Sheet Tabs if multiple sheets */}
                  {previewData.sheets.length > 1 && (
                    <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                      {previewData.sheets.map((sheet, idx) => (
                        <button
                          key={sheet.name}
                          type="button"
                          onClick={() => setActiveSheetIdx(idx)}
                          className={`rounded-lg px-3 py-1.5 text-theme-xs font-semibold transition cursor-pointer ${
                            activeSheetIdx === idx
                              ? "bg-brand-600 text-white shadow-xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {sheet.name} ({sheet.rowCount} dòng)
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Excel Sheet Table */}
                  <div className="overflow-auto max-h-[65vh] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs bg-white dark:bg-gray-900">
                    <table className="w-full text-left text-theme-xs text-gray-700 dark:text-gray-300 border-collapse">
                      <tbody>
                        {(!currentSheet.cells || currentSheet.cells.length === 0) &&
                        (!currentSheet.rows || currentSheet.rows.length === 0) ? (
                          <tr>
                            <td className="p-8 text-center text-gray-400 italic">
                              Trang tính này không có dữ liệu.
                            </td>
                          </tr>
                        ) : currentSheet.cells && currentSheet.cells.length > 0 ? (
                          currentSheet.cells.map((row, rowIdx) => {
                            const isHeader = rowIdx === 0;
                            return (
                              <tr
                                key={rowIdx}
                                className={`border-b border-gray-100 dark:border-gray-800/80 transition-colors ${
                                  isHeader
                                    ? "bg-gray-100/90 dark:bg-gray-800/90 font-bold text-gray-900 dark:text-white sticky top-0 z-10 shadow-xs"
                                    : "hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                                }`}
                              >
                                <td className="px-3 py-2 text-center font-mono text-[11px] text-gray-400 border-r border-gray-200/60 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 select-none w-10 align-middle">
                                  {rowIdx + 1}
                                </td>
                                {row.map((cell, colIdx) => {
                                  // Skip slave cells in merged range so the master cell correctly spans
                                  if (cell.isMerged) return null;
                                  return (
                                    <td
                                      key={colIdx}
                                      rowSpan={cell.rowSpan}
                                      colSpan={cell.colSpan}
                                      className={`px-3 py-2 border-r border-gray-100 dark:border-gray-800/60 align-middle ${
                                        cell.bold ? "font-bold" : ""
                                      } ${
                                        cell.align === "center"
                                          ? "text-center"
                                          : cell.align === "right"
                                            ? "text-right"
                                            : "text-left"
                                      }`}
                                    >
                                      {cell.image && (
                                        <div className="flex flex-col items-center justify-center my-1.5">
                                          <img
                                            src={cell.image}
                                            alt="Hình ảnh trong ô tính"
                                            onClick={() => setZoomedImage(cell.image || null)}
                                            className="max-h-60 max-w-full rounded-md object-contain shadow-xs border border-gray-200 dark:border-gray-700 bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
                                            title="Bấm để phóng to ảnh"
                                          />
                                          <span className="text-[10px] text-gray-400 mt-1 select-none">Bấm để phóng to</span>
                                        </div>
                                      )}
                                      {cell.images && cell.images.length > 1 && (
                                        <div className="flex flex-wrap gap-2 justify-center my-1.5">
                                          {cell.images.slice(1).map((extraImg, idx) => (
                                            <img
                                              key={idx}
                                              src={extraImg}
                                              alt={`Ảnh phụ ${idx + 1}`}
                                              onClick={() => setZoomedImage(extraImg)}
                                              className="max-h-36 max-w-full rounded-md object-contain shadow-xs border border-gray-200 dark:border-gray-700 bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
                                            />
                                          ))}
                                        </div>
                                      )}
                                      {cell.value ? (
                                        <div className="whitespace-pre-line">{cell.value}</div>
                                      ) : !cell.image && (!cell.images || cell.images.length === 0) ? (
                                        <span className="text-gray-300 dark:text-gray-700">—</span>
                                      ) : null}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })
                        ) : (
                          currentSheet.rows.map((row, rowIdx) => {
                            const isHeader = rowIdx === 0;
                            return (
                              <tr
                                key={rowIdx}
                                className={`border-b border-gray-100 dark:border-gray-800/80 transition-colors ${
                                  isHeader
                                    ? "bg-gray-100/90 dark:bg-gray-800/90 font-bold text-gray-900 dark:text-white sticky top-0 z-10 shadow-xs"
                                    : "hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                                }`}
                              >
                                <td className="px-3 py-2 text-center font-mono text-[11px] text-gray-400 border-r border-gray-200/60 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 select-none w-10">
                                  {rowIdx + 1}
                                </td>
                                {row.map((cell, colIdx) => (
                                  <td
                                    key={colIdx}
                                    className="px-3 py-2 border-r border-gray-100 dark:border-gray-800/60 whitespace-nowrap"
                                  >
                                    {cell !== "" ? cell : <span className="text-gray-300 dark:text-gray-700">—</span>}
                                  </td>
                                ))}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Unanchored images in sheet if any */}
                  {currentSheet.unanchoredImages && currentSheet.unanchoredImages.length > 0 && (
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-900/40 shadow-xs">
                      <h5 className="text-theme-xs font-bold text-gray-800 dark:text-gray-200 mb-2">
                        Hình ảnh đính kèm khác trong trang tính ({currentSheet.unanchoredImages.length})
                      </h5>
                      <div className="flex flex-wrap gap-3">
                        {currentSheet.unanchoredImages.map((imgUrl, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <img
                              src={imgUrl}
                              alt={`Hình ảnh ${i + 1}`}
                              onClick={() => setZoomedImage(imgUrl)}
                              className="max-h-48 max-w-xs rounded-lg border border-gray-200 dark:border-gray-700 object-contain shadow-xs bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
                            />
                            <span className="text-[10px] text-gray-400 mt-1">Ảnh {i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (fileType === "word" && previewData?.html) {
              return (
                <div className="max-h-[68vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-xs">
                  <div
                    className="prose dark:prose-invert max-w-none text-theme-sm space-y-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: previewData.html }}
                  />
                </div>
              );
            }

            if (fileType === "pdf") {
              return (
                <div className="h-[70vh] w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                  <iframe
                    src={docUrl || ""}
                    title={previewDoc.fileName || previewDoc.title}
                    className="h-full w-full border-0"
                  />
                </div>
              );
            }

            if (fileType === "image") {
              return (
                <div className="flex flex-col items-center justify-center p-3 bg-gray-50/60 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <img
                    src={docUrl || ""}
                    alt={previewDoc.fileName || previewDoc.title}
                    className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-xs"
                  />
                </div>
              );
            }

            if (fileType === "text" && previewData?.text) {
              return (
                <div className="max-h-[68vh] overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-theme-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 whitespace-pre-wrap">
                  {previewData.text}
                </div>
              );
            }

            return (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30">
                <FileTypeIcon
                  fileName={previewDoc.fileName || previewDoc.title}
                  size="xl"
                  className="shadow-sm"
                />
                <h4 className="mt-4 text-theme-base font-bold text-gray-900 dark:text-white">
                  {previewDoc.fileName || previewDoc.title}
                </h4>
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  Định dạng: {previewDoc.fileName?.split(".").pop()?.toUpperCase() || "Tài liệu"} • Dung lượng: {formatBytes(previewDoc.fileSize)} • Mục đích: {getPurposeLabel(previewDoc.purpose)}
                </p>
                <p className="mt-3 max-w-md text-theme-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Tệp này ({previewDoc.fileName?.split(".").pop()?.toUpperCase()}) không hỗ trợ hiển thị trực tiếp trong khung xem trước của trình duyệt web. Bạn có thể tải tệp về máy để mở bằng ứng dụng tương thích.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {docUrl && (
                    <>
                      <a
                        href={docUrl}
                        download={previewDoc.fileName || previewDoc.title}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition"
                      >
                        <DownloadIcon className="h-4 w-4" />
                        Tải về tệp này
                      </a>
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-theme-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition shadow-xs"
                      >
                        Mở trong tab mới ↗
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Lightbox Zoom for Embedded Images - Mounted directly to document.body with z-[1000] to sit above Modal */}
      {zoomedImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
            onClick={() => setZoomedImage(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative max-h-[95vh] max-w-[95vw] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Action Bar */}
              <div className="w-full flex items-center justify-between pb-3 text-white">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Xem hình ảnh chi tiết
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={zoomedImage}
                    download="hinh_anh_chi_tiet.png"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition backdrop-blur-md cursor-pointer"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Tải ảnh về
                  </a>
                  <button
                    type="button"
                    onClick={() => setZoomedImage(null)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600/80 transition backdrop-blur-md cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {/* Zoomed Image Container */}
              <div className="overflow-auto max-h-[85vh] max-w-[92vw] flex items-center justify-center rounded-2xl bg-gray-900/60 p-2 border border-white/10 shadow-2xl">
                <img
                  src={zoomedImage}
                  alt="Hình ảnh phóng to"
                  className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl bg-white"
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
