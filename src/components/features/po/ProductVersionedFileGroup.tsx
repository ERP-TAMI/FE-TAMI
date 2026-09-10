import { useState, useEffect } from "react";
import {
  FileIcon,
  EyeIcon,
  DownloadIcon,
  TrashBinIcon,
} from "@/icons";
import {
  ProductDocumentItem,
  PurchaseOrderDocumentVersionItem,
} from "@/types/po";

interface ProductVersionedFileGroupProps {
  doc: ProductDocumentItem;
  canEdit: boolean;
  onUploadVersion: (documentId: string, currentVersionNo: number, title: string) => void;
  onDelete: (documentId: string) => void;
  onPreview: (doc: ProductDocumentItem, version?: PurchaseOrderDocumentVersionItem) => void;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "—";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

export function ProductVersionedFileGroup({
  doc,
  canEdit,
  onUploadVersion,
  onDelete,
  onPreview,
}: ProductVersionedFileGroupProps) {
  const versions = doc.versions || [];
  const sortedVersions = [...versions].sort((a, b) => b.versionNo - a.versionNo);

  const maxVersion = sortedVersions[0]?.versionNo || doc.currentVersionNo || 1;
  const [viewingVersionNo, setViewingVersionNo] = useState<number>(maxVersion);

  // Sync khi maxVersion thay đổi
  useEffect(() => {
    setViewingVersionNo(maxVersion);
  }, [maxVersion]);

  const viewingVersion = sortedVersions.find((v) => v.versionNo === viewingVersionNo);
  const isLatest = viewingVersionNo === maxVersion;

  // Lấy đường dẫn file và tên file tương ứng với phiên bản đang chọn xem
  const activeFileUrl = viewingVersion?.fileUrl || doc.fileUrl;
  const activeFileName =
    viewingVersion?.originalFileName || doc.fileName || doc.title || "Tài liệu";
  const activeFileSize = viewingVersion?.fileSize ?? doc.fileSize;
  const activeUploadedAt = viewingVersion?.uploadedAt || doc.linkedAt;
  const activeChangeReason = viewingVersion?.changeReason || (isLatest ? doc.changeReason : null);

  const fullDownloadUrl = activeFileUrl
    ? activeFileUrl.startsWith("http")
      ? activeFileUrl
      : `${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:3000"}${
          activeFileUrl.startsWith("/") ? "" : "/"
        }${activeFileUrl}`
    : undefined;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all hover:border-gray-300 dark:hover:border-gray-700">
      {/* File Card Header & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* File Icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60">
            <FileIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="font-semibold text-xs text-gray-900 dark:text-white truncate max-w-sm"
                title={activeFileName}
              >
                {activeFileName}
              </span>

              {/* Version Badge */}
              <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold font-mono text-brand-600 border border-brand-200/80 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-900/60">
                v{viewingVersionNo}
              </span>

              {/* Status Badge */}
              {isLatest ? (
                <span className="inline-flex items-center rounded-md bg-emerald-50/70 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                  Hiện tại
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                  Phiên bản cũ
                </span>
              )}

              {doc.sourcePoDocument && (
                <span className="text-[10px] text-gray-400">
                  (Từ kho PO)
                </span>
              )}
            </div>

            {/* Subline: Size & Upload Date */}
            <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-gray-400 dark:text-gray-500">
              <span>{formatBytes(activeFileSize)}</span>
              <span>•</span>
              <span>Cập nhật: {formatDate(activeUploadedAt)}</span>
            </div>

            {/* Change Reason Note if any */}
            {activeChangeReason && (
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                  <span className="font-semibold text-gray-700 dark:text-gray-200">Ghi chú:</span>
                  <span className="italic">{activeChangeReason}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-auto border-l border-gray-100 dark:border-gray-800 pl-3">
          {/* Xem trước */}
          <button
            type="button"
            onClick={() => onPreview(doc, viewingVersion)}
            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-600 hover:text-brand-600 hover:bg-brand-50 dark:text-gray-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 transition cursor-pointer"
            title="Xem trước nội dung"
          >
            <EyeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Xem</span>
          </button>

          {/* Tải về */}
          {fullDownloadUrl && (
            <a
              href={fullDownloadUrl}
              download={activeFileName}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs text-gray-600 hover:text-brand-600 hover:bg-brand-50 dark:text-gray-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-300 transition cursor-pointer"
              title="Tải tệp tin về máy"
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Tải về</span>
            </a>
          )}

          {/* Cập nhật version mới (chỉ khi canEdit) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => onUploadVersion(doc.documentId, maxVersion, doc.title || activeFileName)}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50/50 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100 hover:border-brand-300 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-300 transition cursor-pointer"
              title={`Cập nhật phiên bản mới v${maxVersion + 1}`}
            >
              <span>+ Cập nhật v{maxVersion + 1}</span>
            </button>
          )}

          {/* Gỡ / Xóa tài liệu (chỉ khi canEdit) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => onDelete(doc.documentId)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
              title="Gỡ tài liệu này khỏi sản phẩm"
            >
              <TrashBinIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Version Selector Tab Bar (Nếu có từ 2 phiên bản trở lên) */}
      {sortedVersions.length > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/70 px-3.5 py-1.5 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Lịch sử phiên bản ({sortedVersions.length}):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {sortedVersions.map((ver) => {
              const isActive = ver.versionNo === viewingVersionNo;
              return (
                <button
                  key={ver.id || ver.versionNo}
                  type="button"
                  onClick={() => setViewingVersionNo(ver.versionNo)}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? "bg-brand-500 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/40 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:text-white"
                  }`}
                  title={`Xem phiên bản v${ver.versionNo}${
                    ver.changeReason ? ` - ${ver.changeReason}` : ""
                  }`}
                >
                  v{ver.versionNo}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
