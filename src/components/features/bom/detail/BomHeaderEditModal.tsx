import { useState, useEffect } from "react";
import { Edit3, Calendar, FileText, AlertCircle } from "lucide-react";
import type { BomDetail, UpdateBomPayload } from "@/types/bom";
import { canEditDeadline, canEditRdNote } from "@/lib/bomAccess";
import { useAuthStore } from "@/store/authStore";
import { Modal } from "@/components/shared/Modal";

interface BomHeaderEditModalProps {
  isOpen: boolean;
  bom: BomDetail;
  isHistorical?: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateBomPayload) => Promise<void>;
}

export function BomHeaderEditModal({
  isOpen,
  bom,
  isHistorical = false,
  onClose,
  onSubmit,
}: BomHeaderEditModalProps) {
  const user = useAuthStore((state) => state.user);
  const currentStatus = bom.currentRevision?.status || bom.status;

  const allowDeadline = canEditDeadline(user, currentStatus, isHistorical);
  const allowRdNote = canEditRdNote(user, currentStatus, isHistorical);

  const [deadline, setDeadline] = useState("");
  const [rdNote, setRdNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (bom.deadline) {
        // format to YYYY-MM-DD for date input
        const d = new Date(bom.deadline);
        if (!isNaN(d.getTime())) {
          setDeadline(d.toISOString().split("T")[0]);
        } else {
          setDeadline("");
        }
      } else {
        setDeadline("");
      }
      setRdNote(bom.rdNote || "");
      setError(null);
    }
  }, [isOpen, bom]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: UpdateBomPayload = {};
      if (allowDeadline) {
        payload.deadline = deadline ? new Date(deadline).toISOString() : undefined;
      }
      if (allowRdNote) {
        payload.rdNote = rdNote.trim() || undefined;
      }

      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      setError(axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi khi cập nhật thông tin Header");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Chỉnh sửa thông tin Header
            </h3>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Cập nhật hạn định và ghi chú kỹ thuật theo phân quyền
            </p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-theme-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Deadline Field */}
        {allowDeadline ? (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              <Calendar className="h-3.5 w-3.5" />
              <span>Hạn hoàn thành (Deadline)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-theme-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-theme-xs font-semibold text-gray-400">
              <Calendar className="h-3.5 w-3.5" />
              <span>Hạn hoàn thành (Chỉ đọc với vai trò hiện tại)</span>
            </label>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-gray-800/40">
              {bom.deadline ? new Date(bom.deadline).toLocaleDateString("vi-VN") : "Chưa thiết lập"}
            </div>
          </div>
        )}

        {/* RD Note Field */}
        {allowRdNote ? (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              <FileText className="h-3.5 w-3.5" />
              <span>Ghi chú kỹ thuật R&D</span>
            </label>
            <textarea
              rows={3}
              value={rdNote}
              onChange={(e) => setRdNote(e.target.value)}
              placeholder="Nhập ghi chú kỹ thuật của bộ phận R&D..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-theme-xs font-semibold text-gray-400">
              <FileText className="h-3.5 w-3.5" />
              <span>Ghi chú kỹ thuật R&D (Chỉ đọc với vai trò hiện tại)</span>
            </label>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 text-theme-sm italic text-gray-500 dark:border-gray-800 dark:bg-gray-800/40">
              {bom.rdNote || "Không có ghi chú"}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-theme-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (!allowDeadline && !allowRdNote)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
