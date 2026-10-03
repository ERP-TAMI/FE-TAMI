import type { PurchaseOrderDocumentVersionItem } from "@/types/po";

interface Props {
  version: PurchaseOrderDocumentVersionItem;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("vi-VN");
}

function formatBytes(value?: number | null): string {
  if (!value) return "—";
  return value < 1024 * 1024
    ? `${(value / 1024).toFixed(1)} KB`
    : `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentVersionDetails({ version }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3 text-xs dark:border-gray-700 dark:bg-gray-800/50">
      <div className="grid gap-x-5 gap-y-2 sm:grid-cols-2">
        <div>
          <span className="block text-[11px] text-gray-400">Tệp phiên bản v{version.versionNo}</span>
          <span className="break-all font-medium text-gray-800 dark:text-gray-200">{version.originalFileName} · {formatBytes(version.fileSize)}</span>
          {version.fileUrl && (
            <a href={version.fileUrl} target="_blank" rel="noreferrer" className="mt-1 block font-semibold text-brand-600 hover:underline dark:text-brand-300">
              Xem tệp phiên bản
            </a>
          )}
        </div>
        <div>
          <span className="block text-[11px] text-gray-400">Thời điểm cập nhật</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">{formatDateTime(version.uploadedAt)}</span>
        </div>
      </div>
      <div>
        <span className="block text-[11px] text-gray-400">Lý do / Ghi chú thay đổi</span>
        <p className="whitespace-pre-wrap break-words font-medium text-gray-800 dark:text-gray-200">
          {version.changeReason || "Chưa có ghi chú cho phiên bản này."}
        </p>
      </div>
      {version.evidenceUrl && (
        <div>
          <span className="mb-1.5 block text-[11px] text-gray-400">Ảnh bằng chứng yêu cầu thay đổi</span>
          <a href={version.evidenceUrl} target="_blank" rel="noreferrer" className="inline-block rounded-lg border border-gray-200 bg-white p-1.5 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-900">
            <img src={version.evidenceUrl} alt={version.evidenceFileName || `Bằng chứng phiên bản v${version.versionNo}`} className="max-h-36 max-w-56 rounded object-contain" />
            <span className="mt-1 block max-w-56 truncate px-1 text-[11px] font-medium text-brand-600 dark:text-brand-300">{version.evidenceFileName || "Xem ảnh bằng chứng"}</span>
          </a>
        </div>
      )}
    </div>
  );
}
