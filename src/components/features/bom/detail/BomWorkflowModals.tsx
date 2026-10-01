import { useState, useEffect } from "react";
import { ArrowRight, RotateCcw, CheckCircle2, Ban, GitBranch, AlertTriangle } from "lucide-react";
import type { BomStatus } from "@/types/bom";
import {
  BOM_STATUS_CONFIG,
  getAvailableRejectTargets,
  getForwardActionInfo,
} from "@/lib/bomAccess";
import { getApiError } from "@/lib/apiError";
import { Modal } from "@/components/shared/Modal";
import { useDiscardChangesGuard } from "@/hooks/useDiscardChangesGuard";

// ==========================================
// 1. FORWARD MODAL
// ==========================================
interface ForwardModalProps {
  isOpen: boolean;
  currentStatus: string;
  onClose: () => void;
  onSubmit: (note?: string) => Promise<void>;
}

export function BomForwardModal({ isOpen, currentStatus, onClose, onSubmit }: ForwardModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestClose, discardDialog } = useDiscardChangesGuard(Boolean(note), onClose);

  const forwardInfo = getForwardActionInfo(currentStatus);

  useEffect(() => {
    if (isOpen) {
      setNote("");
      setError(null);
    }
  }, [isOpen]);

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
    <>
      <Modal
        open={isOpen}
        onClose={requestClose}
        closeDisabled={isSubmitting}
        closeOnClickOutside
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex h-9 w-9 items-center justify-center rounded-xl">
              <ArrowRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Chuyển bước workflow
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">{forwardInfo.prompt}</p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleForward} className="flex flex-col gap-4">
          {error && (
            <div className="text-theme-xs rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="border-brand-100 bg-brand-50/50 text-theme-sm text-brand-800 dark:border-brand-900/30 dark:bg-brand-950/20 dark:text-brand-300 rounded-xl border p-3">
            <span className="font-semibold">Đích đến: </span>
            <span>{forwardInfo.targetDescription}</span>
          </div>

          <div>
            <label className="text-theme-xs mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Ghi chú bàn giao (Tùy chọn)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú hoặc yêu cầu đối với bộ phận tiếp theo..."
              className="text-theme-sm focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="text-theme-sm cursor-pointer rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-500 text-theme-sm hover:bg-brand-600 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2 font-semibold text-white shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận chuyển bước"}
            </button>
          </div>
        </form>
      </Modal>
      {discardDialog}
    </>
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

export function BomRejectModal({ isOpen, currentStatus, onClose, onSubmit }: RejectModalProps) {
  const availableTargets = getAvailableRejectTargets(currentStatus);
  const [targetStatus, setTargetStatus] = useState<BomStatus>(
    availableTargets[0]?.value || "wait_nvkh",
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasUnsavedChanges = Boolean(reason) || targetStatus !== availableTargets[0]?.value;
  const { requestClose, discardDialog } = useDiscardChangesGuard(hasUnsavedChanges, onClose);

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
    <>
      <Modal
        open={isOpen}
        onClose={requestClose}
        closeDisabled={isSubmitting}
        closeOnClickOutside
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Từ chối / Trả lại NPL
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Trả lại định mức về các bước trước để hiệu chỉnh
              </p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleReject} className="flex flex-col gap-4">
          {error && (
            <div className="text-theme-xs rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="text-theme-xs mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Trả về bước <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as BomStatus)}
              className="text-theme-sm focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white p-3 font-medium text-gray-800 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
            >
              {availableTargets.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-theme-xs mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Lý do từ chối / yêu cầu chỉnh sửa <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nêu rõ lý do trả lại để người phụ trách nắm bắt..."
              className="text-theme-sm focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="text-theme-sm cursor-pointer rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="text-theme-sm inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2 font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận trả lại"}
            </button>
          </div>
        </form>
      </Modal>
      {discardDialog}
    </>
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

export function BomApproveModal({ isOpen, bomCode, onClose, onSubmit }: ApproveModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestClose, discardDialog } = useDiscardChangesGuard(Boolean(note), onClose);

  useEffect(() => {
    if (isOpen) {
      setNote("");
      setError(null);
    }
  }, [isOpen]);

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
    <>
      <Modal
        open={isOpen}
        onClose={requestClose}
        closeDisabled={isSubmitting}
        closeOnClickOutside
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Phê duyệt & Đóng NPL
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Mã định mức: {bomCode}
              </p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleApprove} className="flex flex-col gap-4">
          {error && (
            <div className="text-theme-xs rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="text-theme-sm rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
            Hành động này sẽ chính thức <strong>đóng phiên bản (closed)</strong> và ban hành định
            mức nguyên phụ liệu phục vụ tính toán nhu cầu sản xuất (NPL Aggregate) và đặt mua.
          </div>

          <div>
            <label className="text-theme-xs mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Ghi chú phê duyệt (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập ghi chú phê duyệt của Ban Giám Đốc..."
              className="text-theme-sm focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="text-theme-sm cursor-pointer rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="text-theme-sm inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? "Đang phê duyệt..." : "Phê duyệt đóng NPL"}
            </button>
          </div>
        </form>
      </Modal>
      {discardDialog}
    </>
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

export function BomDiscontinueModal({ isOpen, bomCode, onClose, onSubmit }: DiscontinueModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestClose, discardDialog } = useDiscardChangesGuard(Boolean(reason), onClose);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

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
    <>
      <Modal
        open={isOpen}
        onClose={requestClose}
        closeDisabled={isSubmitting}
        closeOnClickOutside
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Ngừng sử dụng NPL
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">Mã NPL: {bomCode}</p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleDiscontinue} className="flex flex-col gap-4">
          {error && (
            <div className="text-theme-xs rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="text-theme-xs flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>
              Cảnh báo: Sau khi ngừng sử dụng, toàn bộ các phiên bản sẽ bị đóng băng. Thao tác này{" "}
              <strong>không thể hoàn tác</strong>!
            </span>
          </div>

          <div>
            <label className="text-theme-xs mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Lý do ngừng sử dụng <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do ngừng sử dụng (ví dụ: Thay đổi thiết kế toàn diện, hủy mẫu...)"
              className="text-theme-sm w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:border-rose-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="text-theme-sm cursor-pointer rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="text-theme-sm inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2 font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận ngừng sử dụng"}
            </button>
          </div>
        </form>
      </Modal>
      {discardDialog}
    </>
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
  const { requestClose, discardDialog } = useDiscardChangesGuard(Boolean(changeReason), onClose);

  useEffect(() => {
    if (isOpen) {
      setChangeReason("");
      setError(null);
    }
  }, [isOpen]);

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
    <>
      <Modal
        open={isOpen}
        onClose={requestClose}
        closeDisabled={isSubmitting}
        closeOnClickOutside
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex h-9 w-9 items-center justify-center rounded-xl">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Tạo phiên bản {currentRevNo + 1}
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Sao chép dữ liệu từ phiên bản {currentRevNo} và bắt đầu vòng đời mới
              </p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateRev} className="flex flex-col gap-4">
          {error && (
            <div className="text-theme-xs rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="text-theme-xs mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Lý do tạo phiên bản mới <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Ví dụ: Thay thế phụ liệu cúc theo yêu cầu khách hàng..."
              className="text-theme-sm focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="text-theme-sm cursor-pointer rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !changeReason.trim()}
              className="bg-brand-500 text-theme-sm hover:bg-brand-600 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2 font-semibold text-white shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Đang tạo..." : `Tạo phiên bản ${currentRevNo + 1}`}
            </button>
          </div>
        </form>
      </Modal>
      {discardDialog}
    </>
  );
}

// ==========================================
// 6. PROMOTE REVISION MODAL (SA)
// ==========================================
interface PromoteRevisionModalProps {
  isOpen: boolean;
  targetRevisionNo: number;
  currentRevisionNo: number;
  currentStatus: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function BomPromoteRevisionModal({
  isOpen,
  targetRevisionNo,
  currentRevisionNo,
  currentStatus,
  onClose,
  onSubmit,
}: PromoteRevisionModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { requestClose, discardDialog } = useDiscardChangesGuard(Boolean(reason), onClose);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Vui lòng nhập lý do đổi phiên bản hiện hành");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err: unknown) {
      setError(getApiError(err, "Lỗi khi đổi phiên bản hiện hành").message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInProgress = currentStatus !== "closed";

  return (
    <>
      <Modal
        open={isOpen}
        onClose={requestClose}
        closeDisabled={isSubmitting}
        closeOnClickOutside
        size="md"
        title={
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex h-9 w-9 items-center justify-center rounded-xl">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Đặt Phiên bản {targetRevisionNo} làm hiện hành
              </h3>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Phiên bản {currentRevisionNo} vẫn được giữ nguyên, chỉ không còn là bản hiện hành
              </p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isInProgress && (
            <div className="text-theme-xs flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Phiên bản {currentRevisionNo} đang ở bước &quot;{currentStatusLabel(currentStatus)}
                &quot; và sẽ không còn là bản hiện hành. Công việc đang làm dở trên đó được giữ lại
                nhưng người xử lý sẽ không thấy nó nữa.
              </span>
            </div>
          )}

          {error && (
            <div className="text-theme-xs rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="text-theme-xs mb-1 block font-semibold text-gray-700 dark:text-gray-300">
              Lý do <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Phiên bản mới nhất sai định mức, quay về bản đã duyệt trước đó..."
              className="text-theme-sm focus:border-brand-500 w-full rounded-xl border border-gray-200 bg-white p-3 text-gray-900 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={requestClose}
              disabled={isSubmitting}
              className="text-theme-sm cursor-pointer rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="bg-brand-500 text-theme-sm hover:bg-brand-600 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2 font-semibold text-white shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Đang đổi..." : `Đặt Phiên bản ${targetRevisionNo} làm hiện hành`}
            </button>
          </div>
        </form>
      </Modal>
      {discardDialog}
    </>
  );
}

function currentStatusLabel(status: string): string {
  return BOM_STATUS_CONFIG[status]?.label ?? status;
}
