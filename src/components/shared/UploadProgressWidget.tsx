import { useUploadStore } from "@/hooks/useUploadStore";

/** Nổi ở góc màn hình nên tiến độ đi theo người dùng sang trang khác. */
export function UploadProgressWidget() {
  const upload = useUploadStore((s) => s.upload);
  if (!upload) return null;

  const percent = Math.round((upload.done / upload.total) * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[80] w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-theme-sm font-bold text-gray-900 dark:text-white">
          Đang tải lên {upload.done}/{upload.total}
        </span>
        <span className="font-mono text-theme-xs font-semibold text-brand-600 dark:text-brand-400">
          {percent}%
        </span>
      </div>

      {upload.context && (
        <p className="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
          {upload.context}
        </p>
      )}

      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300 dark:bg-brand-400"
          style={{ width: `${percent}%` }}
        />
      </div>

      {upload.fileName && (
        <p className="mt-2 truncate text-theme-xs text-gray-400 dark:text-gray-500">
          {upload.fileName}
        </p>
      )}
    </div>
  );
}
