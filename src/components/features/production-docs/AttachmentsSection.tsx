import { useState } from "react";
import type { ProductionDocAttachment } from "@/types/production-doc";

interface Props {
  attachments: ProductionDocAttachment[];
  isPending: boolean;
  onLink: (documentId: string) => Promise<void>;
  onUnlink: (documentId: string) => Promise<void>;
}

export function AttachmentsSection({
  attachments,
  isPending,
  onLink,
  onUnlink,
}: Props) {
  const [documentIdInput, setDocumentIdInput] = useState("");

  const handleLink = async () => {
    if (!documentIdInput.trim()) return;
    await onLink(documentIdInput.trim());
    setDocumentIdInput("");
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold tracking-wide text-gray-900 uppercase dark:text-white">
          Tài liệu đính kèm ({attachments.length})
          </h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Liên kết hồ sơ kỹ thuật hoặc sơ đồ cắt vào tài liệu này.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="Nhập ID tài liệu..."
          value={documentIdInput}
          onChange={(e) => setDocumentIdInput(e.target.value)}
          className="min-h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-950"
        />
        <button
          type="button"
          onClick={() => void handleLink()}
          disabled={isPending || !documentIdInput.trim()}
          className="min-h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Đính kèm
        </button>
      </div>

      {attachments.length > 0 ? (
        <div className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {attachments.map((att) => (
            <div
              key={att.documentId}
              className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
            >
              <div className="space-y-0.5">
                <span className="font-medium text-gray-900 dark:text-white">
                  {att.title}
                </span>
                {att.documentCode && (
                  <span className="ml-2 font-mono text-xs text-gray-400">
                    ({att.documentCode})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void onUnlink(att.documentId)}
                disabled={isPending}
                className="text-xs font-semibold text-red-500 transition-colors hover:text-red-700"
                title="Gỡ liên kết khỏi Mẫu Fit này, không xóa file gốc."
              >
                Gỡ liên kết
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/70 px-4 py-5 text-center dark:border-gray-800 dark:bg-gray-800/30">
          <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có tài liệu đính kèm.</p>
          <p className="mt-1 text-xs text-gray-400">Nhập ID tài liệu ở trên để bắt đầu liên kết.</p>
        </div>
      )}
    </section>
  );
}
