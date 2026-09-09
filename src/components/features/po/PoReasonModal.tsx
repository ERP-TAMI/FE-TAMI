import { useState } from "react";
import { Modal } from "@/components/shared";

interface Props {
  isOpen: boolean;
  title: string;
  actionText: string;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function PoReasonModal({
  isOpen,
  title,
  actionText,
  isPending,
  onClose,
  onSubmit,
}: Props) {
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reason.trim()) {
      setErrorMsg("Vui lòng nhập lý do thực hiện thao tác này.");
      return;
    }

    try {
      await onSubmit(reason.trim());
      setReason("");
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Có lỗi xảy ra.");
      }
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
            Lý do <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do Khóa PO hoặc Hủy PO (bắt buộc)..."
            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={isPending || !reason.trim()}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
              actionText.includes("Hủy")
                ? "bg-error-600 hover:bg-error-700"
                : "bg-brand-600 hover:bg-brand-700"
            }`}
          >
            {isPending ? "Đang xử lý..." : actionText}
          </button>
        </div>
      </form>
    </Modal>
  );
}
