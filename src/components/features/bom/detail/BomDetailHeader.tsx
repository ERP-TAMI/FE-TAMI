import { PageHeader } from "@/components/shared/PageHeader";
import {
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  GitBranch,
  Copy,
  Ban,
  AlertOctagon,
  History,
  Pencil,
  Unlock,
} from "lucide-react";
import type { BomDetail, RevisionListItem } from "@/types/bom";
import { BomTypeBadge } from "../BomTypeBadge";
import { BomStatusBadge } from "../BomStatusBadge";
import {
  canForwardBom,
  canRejectBom,
  canApproveBom,
  canCreateRevision,
  canDiscontinueBom,
  canRestoreBom,
  canCopyFitBom,
  canEditHeader,
  getForwardActionInfo,
  formatDate,
  BOM_STATUS_CONFIG,
} from "@/lib/bomAccess";
import { useAuthStore } from "@/store/authStore";

interface BomDetailHeaderProps {
  bom: BomDetail;
  readOnly?: boolean;
  revisions?: RevisionListItem[];
  selectedRevisionId?: string;
  isHistorical?: boolean;
  onSelectRevision?: (revisionId: string) => void;
  onOpenEditHeaderModal?: () => void;
  onOpenForwardModal: () => void;
  onOpenRejectModal: () => void;
  onOpenApproveModal: () => void;
  onOpenCreateRevisionModal: () => void;
  onOpenCopyFitModal: () => void;
  onOpenDiscontinueModal: () => void;
  onOpenRestoreConfirm: () => void;
}

export function BomDetailHeader({
  bom,
  readOnly = false,
  revisions = [],
  selectedRevisionId,
  isHistorical = false,
  onSelectRevision,
  onOpenEditHeaderModal,
  onOpenForwardModal,
  onOpenRejectModal,
  onOpenApproveModal,
  onOpenCreateRevisionModal,
  onOpenCopyFitModal,
  onOpenDiscontinueModal,
  onOpenRestoreConfirm,
}: BomDetailHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const currentStatus = isHistorical
    ? (bom.status as import("@/types/bom").BomStatus) || "closed"
    : bom.status === "discontinued" || Boolean(bom.discontinuedAt)
      ? "discontinued"
      : bom.status || bom.currentRevision?.status || "wait_nvkh";
  const isDiscontinued = currentStatus === "discontinued" || !!bom.discontinuedAt;

  const showEditHeader = !readOnly && canEditHeader(user, currentStatus, isHistorical);
  const showForward = !readOnly && canForwardBom(user, currentStatus, isHistorical);
  const showReject = !readOnly && canRejectBom(user, currentStatus, isHistorical);
  const showApprove = !readOnly && canApproveBom(user, currentStatus, isHistorical);
  const showCreateRevision = !readOnly && canCreateRevision(user, currentStatus, isHistorical);
  const showDiscontinue = !readOnly && canDiscontinueBom(user, currentStatus, isHistorical);
  const showRestore = !readOnly && isDiscontinued && canRestoreBom(user, isHistorical);
  const showCopyFit = !readOnly && canCopyFitBom(user, bom, isHistorical);

  const forwardInfo = getForwardActionInfo(currentStatus);

  const displayCode =
    bom.type === "fit"
      ? bom.style?.styleCode || bom.bomCode
      : bom.product?.productCode ||
        bom.purchaseOrderProduct?.productCode ||
        bom.productCodeSnapshot ||
        bom.style?.styleCode ||
        bom.bomCode;

  const typeLabel = bom.type === "fit" ? "NPL Fit" : "NPL PO";
  const displayTitle = `${typeLabel}: ${displayCode}`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        back={{ to: "/bom", label: "Danh sách NPL" }}
        breadcrumb={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Quản lý Nguyên phụ liệu", to: "/bom" },
          { label: displayCode },
        ]}
      />

      {/* Discontinued Banner if Discontinued */}
      {isDiscontinued && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
            <AlertOctagon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-900 dark:text-rose-200">
                Định mức này đã bị Ngừng sử dụng
              </span>
              <span className="rounded-full bg-rose-200/70 px-2 py-0.5 text-[11px] font-bold text-rose-800 dark:bg-rose-900 dark:text-rose-300">
                ĐÃ KHÓA
              </span>
            </div>
            <p className="text-theme-xs mt-1 text-rose-700 dark:text-rose-300">
              Lý do ngừng sử dụng:{" "}
              <span className="font-medium">
                {bom.discontinuedReason || "Không có ghi chú lý do"}
              </span>
            </p>
            {bom.discontinuedAt && (
              <span className="mt-0.5 text-[11px] text-rose-600/80 dark:text-rose-400/80">
                Thời điểm ngừng sử dụng: {formatDate(bom.discontinuedAt)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Historical Revision Banner if viewing historical revision */}
      {isHistorical && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/30">
          <div className="text-theme-sm flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
            <History className="h-4 w-4" />
            <span className="font-semibold">Phiên bản lịch sử (Chế độ chỉ đọc)</span>
            <span className="text-theme-xs text-amber-700 dark:text-amber-400">
              Bạn đang xem một phiên bản cũ đã đóng. Các thao tác chỉnh sửa và chuyển bước bị vô
              hiệu hóa.
            </span>
          </div>
          {onSelectRevision && bom.currentRevision && (
            <button
              type="button"
              onClick={() => onSelectRevision(bom.currentRevision!.id)}
              className="text-theme-xs cursor-pointer rounded-xl bg-amber-600 px-3 py-1.5 font-semibold text-white shadow-2xs transition-colors hover:bg-amber-700"
            >
              Về phiên bản hiện tại
            </button>
          )}
        </div>
      )}

      {/* Main Title & Action Bar - Single Horizontal Line */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Title + Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-white">
            {displayTitle}
          </h1>

          <div className="flex items-center gap-2">
            <BomTypeBadge type={bom.type} />
            <BomStatusBadge status={currentStatus} />

            {/* Revision Selector / Badge */}
            {revisions.length > 1 && onSelectRevision ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedRevisionId || bom.currentRevision?.id || ""}
                  onChange={(e) => onSelectRevision(e.target.value)}
                  className="text-theme-xs focus:border-brand-500 cursor-pointer rounded-full border border-gray-200/80 bg-gray-50 px-2.5 py-0.5 font-semibold text-gray-700 shadow-2xs focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                  title="Chọn phiên bản để xem"
                >
                  {revisions.map((r) => {
                    const isCurrent = r.id === bom.currentRevision?.id || r.isCurrent;
                    return (
                      <option key={r.id} value={r.id}>
                        Phiên bản {r.revisionNo} (
                        {isCurrent ? "Hiện hành" : (BOM_STATUS_CONFIG[r.status]?.label ?? r.status)}
                        )
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : bom.currentRevision ? (
              <span className="text-theme-xs inline-flex items-center gap-1 rounded-full border border-gray-200/80 bg-gray-50 px-2.5 py-0.5 font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                Phiên bản {bom.currentRevision.revisionNo}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right: Actions Group in single horizontal line matching mockup */}
        <div className="flex shrink-0 items-center gap-2.5">
          {showEditHeader && onOpenEditHeaderModal && (
            <button
              type="button"
              onClick={onOpenEditHeaderModal}
              className="text-theme-sm inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Pencil className="h-4 w-4" />
              <span>Sửa thông tin</span>
            </button>
          )}

          {showCopyFit && (
            <button
              type="button"
              onClick={onOpenCopyFitModal}
              className="text-theme-xs inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200/80 bg-white px-3 py-2 font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <Copy className="text-brand-600 h-3.5 w-3.5" />
              <span>Nhập từ Fit NPL</span>
            </button>
          )}

          {showDiscontinue && (
            <button
              type="button"
              onClick={onOpenDiscontinueModal}
              className="text-theme-xs inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-2 font-semibold text-rose-600 shadow-2xs transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/60"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Ngừng sử dụng</span>
            </button>
          )}

          {showRestore && (
            <button
              type="button"
              onClick={onOpenRestoreConfirm}
              className="text-theme-xs inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 shadow-2xs transition-colors hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Mở khóa NPL</span>
            </button>
          )}

          {/* Workflow Action: Reject */}
          {showReject && (
            <button
              type="button"
              onClick={onOpenRejectModal}
              className="text-theme-xs inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 font-semibold text-amber-700 shadow-2xs transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Trả lại</span>
            </button>
          )}

          {/* Workflow Action: Forward (→ Chuyển R&D or → Chuyển TPKH) */}
          {showForward && (
            <button
              type="button"
              onClick={onOpenForwardModal}
              className="border-brand-200 bg-brand-50/80 text-theme-sm text-brand-700 hover:bg-brand-100 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-300 dark:hover:bg-brand-950/70 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3.5 py-2 font-semibold shadow-2xs transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              <span>
                {forwardInfo.buttonLabel === "Chuyển RD" ? "Chuyển R&D" : forwardInfo.buttonLabel}
              </span>
              {forwardInfo.buttonLabel === "Chuyển RD" && (
                <span className="sr-only">Chuyển RD</span>
              )}
            </button>
          )}

          {/* Workflow Action: Approve */}
          {showApprove && (
            <button
              type="button"
              onClick={onOpenApproveModal}
              className="text-theme-sm inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Phê duyệt NPL</span>
            </button>
          )}

          {/* Create Revision (when closed) */}
          {showCreateRevision && (
            <button
              type="button"
              onClick={onOpenCreateRevisionModal}
              className="text-theme-sm inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200/80 bg-white px-3.5 py-2 font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <GitBranch className="text-brand-600 dark:text-brand-400 h-4 w-4" />
              <span>Tạo phiên bản mới</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
