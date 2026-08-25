import { useState, useRef, useEffect } from "react";
import { DocumentStatusSelector } from "./DocumentStatusSelector";
import type { ProductionDocStatus } from "@/types/production-doc";

interface Props {
  docName: string;
  status: ProductionDocStatus;
  updatedAt?: string;
  copiedFromStyleId?: string | null;
  isEditing: boolean;
  isSaving: boolean;
  isExporting: boolean;
  isResyncing: boolean;
  onStatusChange: (status: ProductionDocStatus) => void;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveClick: () => void;
  onPreviewClick: () => void;
  onExportExcelClick: () => void;
  onResyncClick: () => void;
  onCopyClick: () => void;
}

export function DocumentToolbar({
  docName,
  status,
  updatedAt,
  copiedFromStyleId,
  isEditing,
  isSaving,
  isExporting,
  isResyncing,
  onStatusChange,
  onEditClick,
  onCancelEdit,
  onSaveClick,
  onPreviewClick,
  onExportExcelClick,
  onResyncClick,
  onCopyClick,
}: Props) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(event.target as Node)
      ) {
        setOverflowOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="-mx-4 md:-mx-6 px-4 md:px-6 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-200/80 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
      {/* Title & Metadata */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            {docName}
          </h2>
          <DocumentStatusSelector status={status} onChange={onStatusChange} />
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {formattedDate && <span>Cập nhật {formattedDate}</span>}
          {copiedFromStyleId && (
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Copy từ: {copiedFromStyleId}
            </span>
          )}
        </div>
      </div>

      {/* Action Hierarchy */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSaveClick}
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              {isSaving ? "Đang lưu..." : "Lưu tài liệu"}
            </button>
          </>
        ) : (
          <>
            {/* Tertiary Actions */}
            <button
              type="button"
              onClick={onPreviewClick}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition-colors"
            >
              Xem trước
            </button>
            <button
              type="button"
              onClick={onExportExcelClick}
              disabled={isExporting}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-emerald-400 transition-colors"
            >
              {isExporting ? "Đang xuất..." : "Xuất Excel"}
            </button>

            {/* Secondary Action */}
            <button
              type="button"
              onClick={onEditClick}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
            >
              Chỉnh sửa
            </button>

            {/* Overflow Actions Dropdown */}
            <div className="relative" ref={overflowRef}>
              <button
                type="button"
                onClick={() => setOverflowOpen(!overflowOpen)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition-colors"
                title="Tùy chọn khác"
              >
                •••
              </button>

              {overflowOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800 z-30 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowOpen(false);
                      onResyncClick();
                    }}
                    disabled={isResyncing}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Đồng bộ lại từ BOM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowOpen(false);
                      onCopyClick();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Sao chép sang Style khác</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
