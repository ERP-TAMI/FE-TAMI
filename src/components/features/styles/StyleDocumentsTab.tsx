import { useRef, useState } from "react";
import { Button, ConfirmDialog, FileTypeIcon } from "@/components/shared";
import { DownloadIcon, EyeIcon, FileIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { styleDocumentsApi } from "@/api/style-documents.api";
import {
  useRemoveStyleDocument,
  useStyleDocuments,
  useUploadStyleDocument,
} from "@/hooks/useStyleDocuments";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/shared";
import { getApiError } from "@/lib/apiError";
import type { StyleDocumentItem } from "@/types/style-document";

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

interface UploadingItem {
  tempId: string;
  fileName: string;
  status: "uploading" | "error";
  errorMessage?: string;
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
  return d.toLocaleString("vi-VN");
}

function validateFile(file: File): string | null {
  const ext = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Định dạng "${ext}" không được hỗ trợ. Chỉ chấp nhận: ${ALLOWED_EXTENSIONS.join(", ")}.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Dung lượng tệp vượt quá giới hạn 20MB.`;
  }
  return null;
}

interface Props {
  styleId: string;
}

export function StyleDocumentsTab({ styleId }: Props) {
  const { toast, showToast, hideToast } = useToast();
  const documentsQuery = useStyleDocuments(styleId);
  const uploadMutation = useUploadStyleDocument(styleId);
  const removeMutation = useRemoveStyleDocument(styleId);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingItems, setUploadingItems] = useState<UploadingItem[]>([]);
  const [pendingRemove, setPendingRemove] = useState<StyleDocumentItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    files.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        showToast(`${file.name}: ${validationError}`, "error");
        return;
      }

      const tempId = `${file.name}_${file.size}_${Date.now()}_${Math.random()}`;
      setUploadingItems((prev) => [
        ...prev,
        { tempId, fileName: file.name, status: "uploading" },
      ]);

      uploadMutation
        .mutateAsync(file)
        .then(() => {
          setUploadingItems((prev) => prev.filter((item) => item.tempId !== tempId));
        })
        .catch((err) => {
          const message = getApiError(err, `Tải lên "${file.name}" thất bại.`).message;
          setUploadingItems((prev) =>
            prev.map((item) =>
              item.tempId === tempId ? { ...item, status: "error", errorMessage: message } : item,
            ),
          );
        });
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const dismissUploadError = (tempId: string) => {
    setUploadingItems((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const handleView = async (doc: StyleDocumentItem, download: boolean) => {
    // No noopener/noreferrer: those make window.open() return null, so we couldn't navigate it later.
    const popup = window.open("", "_blank");
    try {
      const { url } = await styleDocumentsApi.getViewUrl(styleId, doc.documentId, download);
      if (popup) popup.location.href = url;
    } catch (err) {
      popup?.close();
      showToast(getApiError(err, "Không thể mở tài liệu.").message, "error");
    }
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    try {
      await removeMutation.mutateAsync(pendingRemove.documentId);
      showToast("Đã gỡ tài liệu khỏi mẫu Fit.");
    } catch (err) {
      showToast(getApiError(err, "Gỡ tài liệu thất bại.").message, "error");
    } finally {
      setPendingRemove(null);
    }
  };

  const documents = documentsQuery.data ?? [];

  return (
    <div
      className="space-y-5"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <div
        className={`overflow-hidden rounded-2xl border shadow-xs transition-colors dark:bg-gray-900 ${
          isDragOver
            ? "border-brand-400 bg-brand-50/40 dark:border-brand-700"
            : "border-gray-200 bg-white dark:border-gray-800"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
          <h3 className="text-theme-base font-bold text-gray-900 dark:text-white">
            Danh sách tài liệu ({documents.length})
          </h3>
          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
            <PlusIcon className="h-4 w-4" />
            Tải tài liệu lên
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {uploadingItems.length > 0 && (
          <div className="space-y-2 border-b border-gray-100 p-3 dark:border-gray-800">
            {uploadingItems.map((item) => (
              <div
                key={item.tempId}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-theme-xs ${
                  item.status === "error"
                    ? "border-error-200 bg-error-50/60 dark:border-error-900/40 dark:bg-error-950/20"
                    : "border-gray-200 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileTypeIcon fileName={item.fileName} size="xs" />
                  <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                    {item.fileName}
                  </span>
                </div>
                {item.status === "uploading" ? (
                  <span className="flex shrink-0 items-center gap-1.5 text-brand-600 dark:text-brand-400">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Đang tải lên...
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-error-600 dark:text-error-400">{item.errorMessage}</span>
                    <button
                      type="button"
                      onClick={() => dismissUploadError(item.tempId)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {documentsQuery.isLoading ? (
          <div className="p-10 text-center text-theme-sm text-gray-500 dark:text-gray-400">
            Đang tải danh sách tài liệu...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <FileIcon className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mt-3 text-theme-base font-semibold text-gray-900 dark:text-white">
              Chưa có tài liệu nào được đính kèm.
            </p>
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              Bấm "Tải tài liệu lên" hoặc kéo thả tệp vào đây để đính kèm vào mẫu Fit này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-theme-sm text-gray-700 dark:text-gray-300">
              <thead className="border-b border-gray-200 bg-gray-50/80 text-theme-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3.5">Tên tài liệu</th>
                  <th className="px-5 py-3.5">Dung lượng</th>
                  <th className="px-5 py-3.5">Ngày tải lên</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {documents.map((doc) => (
                  <tr
                    key={doc.documentId}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon fileName={doc.fileName} size="md" />
                        <span className="truncate font-semibold text-gray-900 dark:text-white max-w-md" title={doc.fileName}>
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-theme-xs text-gray-500 dark:text-gray-400">
                      {formatBytes(doc.byteSize)}
                    </td>
                    <td className="px-5 py-4 text-theme-xs text-gray-500 dark:text-gray-400">
                      {formatDate(doc.uploadedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void handleView(doc, false)}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-theme-xs font-medium text-brand-700 shadow-xs hover:bg-brand-100 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-900/50 transition-colors cursor-pointer"
                          title="Xem tài liệu"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleView(doc, true)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-theme-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          title="Tải xuống"
                        >
                          <DownloadIcon className="h-3.5 w-3.5" />
                          Tải xuống
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingRemove(doc)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950/40 dark:hover:text-error-400 transition-colors cursor-pointer"
                          title="Gỡ khỏi mẫu Fit"
                        >
                          <TrashBinIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Gỡ tài liệu khỏi mẫu Fit"
        description={
          <>
            Bạn có chắc muốn gỡ <strong>{pendingRemove?.fileName}</strong> khỏi mẫu Fit này?
            <br />
            Tệp gốc vẫn được giữ lại trong hệ thống, chỉ liên kết với mẫu Fit này bị xóa.
          </>
        }
        confirmLabel="Gỡ tài liệu"
        variant="danger"
        isSubmitting={removeMutation.isPending}
        onConfirm={() => void handleConfirmRemove()}
        onClose={() => setPendingRemove(null)}
      />

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
