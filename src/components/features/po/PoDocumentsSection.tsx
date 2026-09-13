import { useState } from "react";
import { Button, ConfirmDialog, FileTypeIcon } from "@/components/shared";
import { FileIcon, DownloadIcon, TrashBinIcon, EyeIcon } from "@/icons";
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
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

import { PO_DOCUMENT_CATEGORIES, getDocumentCategoryInfo } from "@/lib/poDocuments";
import { PoDocumentCategoryPicker } from "./PoDocumentCategoryPicker";
import { PoUploadDocumentsModal } from "./PoUploadDocumentsModal";

export function PoDocumentsSection({
  documents,
  isLocked,
  isPending,
  onUpload,
  onUnlink,
  onUpdatePurpose,
}: Props) {
  const [updatingDocId, setUpdatingDocId] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingRemove, setPendingRemove] =
    useState<PurchaseOrderDocumentItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("all");

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    setIsRemoving(true);
    try {
      await onUnlink(pendingRemove.documentId);
      setPendingRemove(null);
    } finally {
      setIsRemoving(false);
    }
  };

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






  const handleCategoryChange = async (documentId: string, newPurpose: string) => {
    if (!onUpdatePurpose) return;
    setUpdatingDocId(documentId);
    try {
      await onUpdatePurpose(documentId, newPurpose);
    } finally {
      setUpdatingDocId(null);
    }
  };


  return (
    <div className="space-y-5">
      {/* Tải tệp lên qua modal — xem PoUploadDocumentsModal. */}
      {!isLocked && (
        <PoUploadDocumentsModal
          isOpen={isUploadOpen}
          isPending={isPending}
          onUpload={(files, targetPurpose) => onUpload(files, targetPurpose)}
          onClose={() => setIsUploadOpen(false)}
        />
      )}

      {/* Documents List Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 dark:border-gray-800">
          <h3 className="text-theme-base font-bold text-gray-900 dark:text-white">
            Tài liệu ({documents.length})
          </h3>
          {!isLocked && (
            <Button size="sm" onClick={() => setIsUploadOpen(true)} disabled={isPending}>
              + Tải tài liệu lên
            </Button>
          )}
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
                          <PoDocumentCategoryPicker
                            value={doc.purpose}
                            disabled={isPending}
                            isSaving={updatingDocId === doc.documentId}
                            onChange={(newPurpose) =>
                              void handleCategoryChange(doc.documentId, newPurpose)
                            }
                          />
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
                              onClick={() => setPendingRemove(doc)}
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

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Gỡ tài liệu khỏi đơn hàng PO"
        description={
          <>
            Bạn có chắc muốn gỡ{" "}
            <strong>{pendingRemove?.fileName || pendingRemove?.title}</strong>{" "}
            khỏi đơn hàng PO này?
            <br />
            Tệp gốc vẫn được giữ lại trong hệ thống, chỉ liên kết với PO này bị
            xóa.
          </>
        }
        confirmLabel="Gỡ tài liệu"
        variant="danger"
        isSubmitting={isRemoving || isPending}
        onConfirm={() => void handleConfirmRemove()}
        onClose={() => setPendingRemove(null)}
      />
    </div>
  );
}
