import { useState, useEffect } from "react";
import { poApi } from "@/api/po.api";
import { uploadsApi } from "@/api/uploads.api";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { getPurposeLabel } from "@/lib/poDocuments";
import { DownloadIcon, EyeIcon } from "@/icons";
import { FileTypeIcon } from "@/components/shared";
import type { PurchaseOrderDocumentItem, PoDocumentPreviewResponse } from "@/types/po";

export interface PreviewDocumentLike {
  documentId: string;
  title?: string;
  fileName?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  purpose?: string | null;
  versionId?: string | null;
  versionNo?: number | null;
  linkedAt?: string | null;
}

interface Props {
  poId: string;
  document: PurchaseOrderDocumentItem | PreviewDocumentLike;
  onBack: () => void;
  onAttachToQuickForm?: (docId: string) => void;
  isSelectedInQuickForm?: boolean;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

export function PoSplitDocumentPreview({
  poId,
  document: doc,
  onBack,
  onAttachToQuickForm,
  isSelectedInQuickForm,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<PoDocumentPreviewResponse | null>(null);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileName = doc.fileName || doc.title || "Tài liệu";
  const ext = fileName.split(".").pop()?.toUpperCase() || "FILE";

  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const versionId = (doc as { versionId?: string }).versionId;

  // `doc.fileUrl` is a full presigned URL for PO-level documents, but a raw
  // (unsigned) S3 object key for PO-product documents — resolve the latter
  // into a real, browsable URL before it's ever used as an <img>/<iframe>/<a>
  // src, otherwise it 404s straight against the frontend origin.
  useEffect(() => {
    let isMounted = true;
    if (!doc.fileUrl) {
      setDocUrl(null);
      setDownloadUrl(null);
      return;
    }
    if (!uploadsApi.isRawObjectKey(doc.fileUrl)) {
      setDocUrl(doc.fileUrl);
      setDownloadUrl(doc.fileUrl);
      return;
    }
    setDocUrl(null);
    setDownloadUrl(null);
    const objectKey = doc.fileUrl;
    uploadsApi
      .getViewUrl(objectKey)
      .then((url) => {
        if (isMounted) setDocUrl(url);
      })
      .catch(() => {
        if (isMounted) setDocUrl(null);
      });
    uploadsApi
      .getViewUrl(objectKey, { download: true, fileName })
      .then((url) => {
        if (isMounted) setDownloadUrl(url);
      })
      .catch(() => {
        if (isMounted) setDownloadUrl(null);
      });
    return () => {
      isMounted = false;
    };
  }, [doc.fileUrl, fileName]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);
    setActiveSheetIdx(0);

    poApi
      .previewDocument(poId, doc.documentId, versionId)
      .then((res) => {
        if (isMounted) {
          setPreviewData(res);
        }
      })
      .catch(() => {
        if (isMounted) {
          // Fallback: the /preview endpoint only knows documents linked into
          // the PO's own document pool (see purchase-orders.service.ts
          // previewDocument) — it 404s for a document that only exists on a
          // product (sourcePoDocument: false). Degrade to a plain
          // open/download experience via the resolved file URL instead of
          // silently showing nothing.
          setErrorMsg(
            "Không thể tạo bản xem trước chi tiết cho tài liệu này. Bạn vẫn có thể mở hoặc tải tệp gốc về máy.",
          );
          setPreviewData({
            type: getFileType(fileName),
            fileName,
            fileUrl: doc.fileUrl || undefined,
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [poId, doc.documentId, versionId, fileName, doc.fileUrl]);

  const fileType = previewData?.type || getFileType(fileName);

  return (
    <div className="flex flex-col h-full">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            ← Quay lại danh sách
          </button>

          <div className="flex items-center gap-1.5">
            {onAttachToQuickForm && (
              <button
                type="button"
                onClick={() => onAttachToQuickForm(doc.documentId)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                  isSelectedInQuickForm
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-700 dark:text-emerald-200"
                    : "bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-300"
                }`}
              >
                {isSelectedInQuickForm ? "✓ Đang gán vào SP mới" : "+ Gán vào SP mới"}
              </button>
            )}

            {(downloadUrl || docUrl) && (
              <a
                href={downloadUrl || docUrl!}
                download={fileName}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition"
                title="Tải tệp về máy"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                <span>Tải về</span>
              </a>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 border border-brand-100 dark:bg-brand-950/40 dark:border-brand-900/40 dark:text-brand-400">
            <EyeIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate" title={fileName}>
              {fileName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
              <span className="font-mono uppercase font-bold text-brand-600 dark:text-brand-400">
                {ext}
              </span>
              <span>•</span>
              <span>{formatBytes(doc.fileSize)}</span>
              {doc.purpose && (
                <>
                  <span>•</span>
                  <span>{getPurposeLabel(doc.purpose)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── PREVIEW CONTENT AREA ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-3 pr-0.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mb-3" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Đang nạp dữ liệu xem trước tài liệu...
            </p>
          </div>
        ) : (
          <>
          {errorMsg && (
            <div className="mb-3 p-3 rounded-xl border border-warning-200 bg-warning-50 text-xs text-warning-700 dark:border-warning-900/40 dark:bg-warning-950/30 dark:text-warning-300">
              {errorMsg}
            </div>
          )}
          {(() => {
          // EXCEL PREVIEW
          if (fileType === "excel" && previewData?.sheets && previewData.sheets.length > 0) {
            const currentSheet = previewData.sheets[activeSheetIdx] || previewData.sheets[0];

            return (
              <div className="space-y-2.5 h-full flex flex-col">
                {previewData.sheets.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 border-b border-gray-100 dark:border-gray-800 pb-2 shrink-0">
                    {previewData.sheets.map((sheet, idx) => (
                      <button
                        key={sheet.name}
                        type="button"
                        onClick={() => setActiveSheetIdx(idx)}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
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

                {/* Table view */}
                <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs">
                  <table className="w-full text-left text-[11px] text-gray-700 dark:text-gray-300 border-collapse">
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
                              <td className="px-2 py-1.5 text-center font-mono text-[10px] text-gray-400 border-r border-gray-200/60 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 select-none w-8 align-middle">
                                {rowIdx + 1}
                              </td>
                              {row.map((cell, colIdx) => {
                                if (cell.isMerged) return null;
                                return (
                                  <td
                                    key={colIdx}
                                    rowSpan={cell.rowSpan}
                                    colSpan={cell.colSpan}
                                    className={`px-2.5 py-1.5 border-r border-gray-100 dark:border-gray-800/60 align-middle ${
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
                                      <div className="flex flex-col items-center justify-center my-1">
                                        <img
                                          src={cell.image}
                                          alt="Ảnh ô"
                                          className="max-h-40 max-w-full rounded object-contain border border-gray-200 dark:border-gray-700 bg-white"
                                        />
                                      </div>
                                    )}
                                    {cell.value ? (
                                      <div className="whitespace-pre-line">{cell.value}</div>
                                    ) : !cell.image ? (
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
                              <td className="px-2 py-1.5 text-center font-mono text-[10px] text-gray-400 border-r border-gray-200/60 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 select-none w-8">
                                {rowIdx + 1}
                              </td>
                              {row.map((cell, colIdx) => (
                                <td
                                  key={colIdx}
                                  className="px-2.5 py-1.5 border-r border-gray-100 dark:border-gray-800/60 whitespace-nowrap"
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
              </div>
            );
          }

          // WORD PREVIEW
          if (fileType === "word" && previewData?.html) {
            return (
              <div className="overflow-y-auto h-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
                <div
                  className="prose dark:prose-invert max-w-none text-xs space-y-2 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewData.html) }}
                />
              </div>
            );
          }

          // PDF PREVIEW
          if (fileType === "pdf" && docUrl) {
            return (
              <div className="h-full w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
                <iframe
                  src={docUrl}
                  title={fileName}
                  className="h-full w-full border-0 min-h-[550px]"
                />
              </div>
            );
          }

          // IMAGE PREVIEW
          if (fileType === "image" && docUrl) {
            return (
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50/60 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 h-full">
                <img
                  src={docUrl}
                  alt={fileName}
                  className="max-h-[580px] max-w-full rounded-lg object-contain shadow-xs"
                />
              </div>
            );
          }

          // TEXT PREVIEW
          if (fileType === "text" && previewData?.text) {
            return (
              <div className="overflow-auto h-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-[11px] text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 whitespace-pre-wrap">
                {previewData.text}
              </div>
            );
          }

          // FALLBACK / UNSUPPORTED
          return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/30">
              <FileTypeIcon fileName={fileName} size="xl" className="shadow-xs" />
              <h4 className="mt-3 text-xs font-bold text-gray-900 dark:text-white">
                {fileName}
              </h4>
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Định dạng {ext} không hỗ trợ hiển thị trực tiếp trong khung.
              </p>
              {(downloadUrl || docUrl) && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={downloadUrl || docUrl!}
                    download={fileName}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Tải về máy
                  </a>
                  {docUrl && (
                    <a
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition shadow-xs"
                    >
                      Mở tab mới ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          );
          })()}
          </>
        )}
      </div>
    </div>
  );
}
