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
    <div className="space-y-3 pt-4 border-t border-gray-200/80 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Tài liệu đính kèm ({attachments.length})
        </h4>
        <span className="text-[11px] text-gray-400">
          Hỗ trợ đính kèm hồ sơ kỹ thuật / sơ đồ cắt
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Nhập ID tài liệu..."
          value={documentIdInput}
          onChange={(e) => setDocumentIdInput(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => void handleLink()}
          disabled={isPending || !documentIdInput.trim()}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 transition-colors disabled:opacity-50"
        >
          Đính kèm
        </button>
      </div>

      {attachments.length > 0 ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200/80 rounded-xl bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          {attachments.map((att) => (
            <div
              key={att.documentId}
              className="flex items-center justify-between p-3 text-xs"
            >
              <div className="space-y-0.5">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {att.title}
                </span>
                {att.documentCode && (
                  <span className="ml-2 font-mono text-[11px] text-gray-400">
                    ({att.documentCode})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void onUnlink(att.documentId)}
                disabled={isPending}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                title="Gỡ liên kết khỏi Mẫu Fit này, không xóa file gốc."
              >
                Gỡ liên kết
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Chưa có tài liệu đính kèm.</p>
      )}
    </div>
  );
}
