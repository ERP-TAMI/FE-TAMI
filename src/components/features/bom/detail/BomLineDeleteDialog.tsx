import { Trash2, AlertTriangle } from "lucide-react";
import type { BomLineItem } from "@/types/bom";

interface BomLineDeleteDialogProps {
  isOpen: boolean;
  line: BomLineItem | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function BomLineDeleteDialog({
  isOpen,
  line,
  isSubmitting = false,
  onClose,
  onConfirm,
}: BomLineDeleteDialogProps) {
  if (!isOpen || !line) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Xóa dòng vật tư
            </h3>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Thao tác này sẽ gỡ bỏ vật tư khỏi định mức hiện tại.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-theme-sm text-gray-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-gray-200">
          <p className="font-semibold text-rose-900 dark:text-rose-300">
            Bạn có chắc chắn muốn xóa vật tư này?
          </p>
          <div className="mt-1 text-theme-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{line.materialNameSnapshot}</span>
            {line.materialGroupSnapshot && ` • Nhóm: ${line.materialGroupSnapshot}`}
            {line.unitSnapshot && ` • ĐVT: ${line.unitSnapshot}`}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-theme-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isSubmitting ? "Đang xóa..." : "Xóa vật tư"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
