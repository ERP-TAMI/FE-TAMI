import { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Ban,
  GitBranch,
  AlertTriangle,
} from "lucide-react";
import type { BomStatus } from "@/types/bom";
import { getAvailableRejectTargets, getForwardActionInfo } from "@/lib/bomAccess";
import { getApiError } from "@/lib/apiError";

// ==========================================
// 1. FORWARD MODAL
// ==========================================
interface ForwardModalProps {
  isOpen: boolean;
  currentStatus: string;
  onClose: () => void;
  onSubmit: (note?: string) => Promise<void>;
}

export function BomForwardModal({
  isOpen,
  currentStatus,
  onClose,
  onSubmit,
}: ForwardModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forwardInfo = getForwardActionInfo(currentStatus);

  useEffect(() => {
    if (isOpen) {
      setNote("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(note.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(getApiError(err, "Lỗi khi chuyển bước").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Chuyển bước workflow
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                {forwardInfo.prompt}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleForward} className="mt-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-theme-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-theme-sm text-brand-800 dark:border-brand-900/30 dark:bg-brand-950/20 dark:text-brand-300">
            <span className="font-semibold">Đích đến: </span>
            <span>{forwardInfo.targetDescription}</span>
          </div>

          <div>
            <label className="mb-1 block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Ghi chú bàn giao (Tùy chọn)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú cho bộ phận tiếp theo..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

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
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận chuyển bước"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. REJECT MODAL
// ==========================================
interface RejectModalProps {
  isOpen: boolean;
  currentStatus: string;
  onClose: () => void;
  onSubmit: (targetStatus: BomStatus, reason: string) => Promise<void>;
}

export function BomRejectModal({
  isOpen,
  currentStatus,
  onClose,
  onSubmit,
}: RejectModalProps) {
  const availableTargets = getAvailableRejectTargets(currentStatus);
  const [targetStatus, setTargetStatus] = useState<BomStatus>(
    availableTargets[0]?.value || "wait_nvkh"
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const targets = getAvailableRejectTargets(currentStatus);
      if (targets.length > 0) {
        setTargetStatus(targets[0].value);
      }
      setReason("");
      setError(null);
    }
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Vui lòng nhập lý do từ chối / trả lại");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(targetStatus, trimmedReason);
      onClose();
    } catch (err: unknown) {
      setError(getApiError(err, "Lỗi khi trả lại").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Từ chối / Trả lại BOM
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Trả lại định mức về các bước trước để hiệu chỉnh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleReject} className="mt-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-theme-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Trả về bước <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as BomStatus)}
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-theme-sm font-medium text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
            >
              {availableTargets.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Lý do từ chối / yêu cầu chỉnh sửa <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nêu rõ lý do trả lại để người phụ trách nắm bắt..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

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
              disabled={isSubmitting || !reason.trim()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận trả lại"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. APPROVE MODAL (SA Close)
// ==========================================
interface ApproveModalProps {
  isOpen: boolean;
  bomCode: string;
  onClose: () => void;
  onSubmit: (note?: string) => Promise<void>;
}

export function BomApproveModal({
  isOpen,
  bomCode,
  onClose,
  onSubmit,
}: ApproveModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNote("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(note.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(getApiError(err, "Lỗi khi phê duyệt").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Phê duyệt & Đóng BOM
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Mã định mức: {bomCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleApprove} className="mt-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-theme-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-theme-sm text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
            Hành động này sẽ chính thức <strong>đóng phiên bản (closed)</strong> và ban hành định mức nguyên phụ liệu phục vụ tính toán nhu cầu sản xuất (NPL Aggregate) và đặt mua.
          </div>

          <div>
            <label className="mb-1 block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Ghi chú phê duyệt (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú phê duyệt của Ban Giám Đốc..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

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
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "Đang phê duyệt..." : "Phê duyệt đóng BOM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 4. DISCONTINUE MODAL
// ==========================================
interface DiscontinueModalProps {
  isOpen: boolean;
  bomCode: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function BomDiscontinueModal({
  isOpen,
  bomCode,
  onClose,
  onSubmit,
}: DiscontinueModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDiscontinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Vui lòng nhập lý do ngừng sử dụng");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmedReason);
      onClose();
    } catch (err: unknown) {
      setError(getApiError(err, "Lỗi khi ngừng sử dụng").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Ngừng sử dụng BOM
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Mã BOM: {bomCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleDiscontinue} className="mt-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-theme-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-theme-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              Cảnh báo: Sau khi ngừng sử dụng, toàn bộ các phiên bản sẽ bị đóng băng. Thao tác này <strong>không thể hoàn tác</strong>!
            </span>
          </div>

          <div>
            <label className="mb-1 block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Lý do ngừng sử dụng <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do ngừng sử dụng (ví dụ: Thay đổi thiết kế toàn diện, hủy mẫu...)"
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-theme-sm text-gray-900 focus:border-rose-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

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
              disabled={isSubmitting || !reason.trim()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận ngừng sử dụng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. CREATE REVISION MODAL
// ==========================================
interface CreateRevisionModalProps {
  isOpen: boolean;
  currentRevNo: number;
  onClose: () => void;
  onSubmit: (changeReason: string) => Promise<void>;
}

export function BomCreateRevisionModal({
  isOpen,
  currentRevNo,
  onClose,
  onSubmit,
}: CreateRevisionModalProps) {
  const [changeReason, setChangeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setChangeReason("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateRev = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = changeReason.trim();
    if (!trimmedReason) {
      setError("Vui lòng nhập lý do tạo phiên bản mới");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmedReason);
      onClose();
    } catch (err: unknown) {
      setError(getApiError(err, "Lỗi khi tạo phiên bản").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-md flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Tạo Phiên Bản Mới (Rev {currentRevNo + 1})
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Sao chép dữ liệu từ Rev {currentRevNo} và bắt đầu vòng đời mới
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreateRev} className="mt-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-theme-xs text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-theme-xs font-semibold text-gray-700 dark:text-gray-300">
              Lý do tạo phiên bản mới <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Ví dụ: Thay thế phụ liệu cúc theo yêu cầu khách hàng..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-theme-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

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
              disabled={isSubmitting || !changeReason.trim()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-brand-600 disabled:opacity-50"
            >
              {isSubmitting ? "Đang tạo..." : `Tạo Rev ${currentRevNo + 1}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
