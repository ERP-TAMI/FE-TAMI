import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, RotateCw } from "lucide-react";
import {
  useBom,
  useUpdateBom,
  useBomRevisions,
  useBomRevisionDetail,
  usePromoteBomRevision,
  useForwardBom,
  useRejectBom,
  useApproveBom,
  useCreateBomRevision,
  useCopyFitToPoBom,
  useDiscontinueBom,
  useRestoreBom,
} from "@/hooks/useBoms";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { BomLineItem, UpdateBomPayload, BomStatus } from "@/types/bom";

// Components
import { BomDetailHeader } from "@/components/features/bom/detail/BomDetailHeader";
import { BomHeaderEditModal } from "@/components/features/bom/detail/BomHeaderEditModal";
import { BomWorkflowStepper } from "@/components/features/bom/detail/BomWorkflowStepper";
import { BomDetailKpiCards } from "@/components/features/bom/detail/BomDetailKpiCards";
import { BomLinesEditor } from "@/components/features/bom/detail/BomLinesEditor";
import {
  BomForwardModal,
  BomRejectModal,
  BomApproveModal,
  BomDiscontinueModal,
  BomCreateRevisionModal,
  BomPromoteRevisionModal,
} from "@/components/features/bom/detail/BomWorkflowModals";
import { BomRevisionsTab } from "@/components/features/bom/detail/BomRevisionsTab";
import { BomRevisionDiffModal } from "@/components/features/bom/detail/BomRevisionDiffModal";
import { BomCopyFitModal } from "@/components/features/bom/detail/BomCopyFitModal";
import { useAuthStore } from "@/store/authStore";
import { canPromoteRevision } from "@/lib/bomAccess";

type ActiveTab = "lines" | "revisions";

export default function BomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const user = useAuthStore((state) => state.user);

  const tabFromUrl = searchParams.get("tab");
  const initialTab: ActiveTab = tabFromUrl === "revisions" ? "revisions" : "lines";
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  const selectedRevisionParam = searchParams.get("revision");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "revisions" || t === "lines") {
      setActiveTab(t);
    }
  }, [searchParams]);

  // Query Detail
  const {
    data: bom,
    isLoading: isLoadingBom,
    isError: isErrorBom,
    error: errorBom,
    refetch: refetchBom,
  } = useBom(id);

  // Query Revisions
  const { data: revisions, isLoading: isLoadingRevisions } = useBomRevisions(id);

  // Check if viewing historical revision
  const isHistorical = Boolean(
    selectedRevisionParam &&
      bom?.currentRevision?.id &&
      selectedRevisionParam !== bom.currentRevision.id,
  );

  // Query Historical Revision Detail if requested
  const { data: historicalRevision, isLoading: isLoadingHistorical } = useBomRevisionDetail(
    id,
    isHistorical ? selectedRevisionParam! : undefined,
  );

  const activeRevisionId = isHistorical ? selectedRevisionParam! : bom?.currentRevision?.id;

  // Mutation Hooks
  const updateBomMutation = useUpdateBom(id || "");
  const promoteMutation = usePromoteBomRevision(id || "");
  const forwardMutation = useForwardBom(id || "");
  const rejectMutation = useRejectBom(id || "");
  const approveMutation = useApproveBom(id || "");
  const createRevisionMutation = useCreateBomRevision(id || "");
  const copyFitMutation = useCopyFitToPoBom(id || "");
  const discontinueMutation = useDiscontinueBom(id || "");
  const restoreMutation = useRestoreBom(id || "");

  // Modal States
  const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [promoteTargetId, setPromoteTargetId] = useState<string | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDiscontinueModalOpen, setIsDiscontinueModalOpen] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isCreateRevModalOpen, setIsCreateRevModalOpen] = useState(false);
  const [isCopyFitModalOpen, setIsCopyFitModalOpen] = useState(false);
  const [diffModalRevId, setDiffModalRevId] = useState<string | null>(null);

  const [hasUnsavedLines, setHasUnsavedLines] = useState(false);

  if (isLoadingBom) {
    return (
      <div className="flex flex-col gap-6" data-testid="bom-detail-skeleton">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-8 w-80 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="h-24 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
          <div className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
        </div>
        <div className="h-96 w-full animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    );
  }

  if (isErrorBom || !bom) {
    const errorMsg =
      (errorBom as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      "Không tìm thấy thông tin NPL hoặc phiên làm việc đã hết hạn.";
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          Không thể tải chi tiết NPL
        </h2>
        <p className="text-theme-sm mt-1 max-w-md text-gray-500 dark:text-gray-400">{errorMsg}</p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/bom")}
            className="text-theme-sm cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Về danh sách
          </button>
          <button
            type="button"
            onClick={() => refetchBom()}
            className="bg-brand-500 text-theme-sm hover:bg-brand-600 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 font-semibold text-white shadow-xs"
          >
            <RotateCw className="h-4 w-4" />
            <span>Thử lại</span>
          </button>
        </div>
      </div>
    );
  }

  // Active status and lines based on historical vs current
  const currentStatus = isHistorical
    ? (historicalRevision?.status as BomStatus) || "closed"
    : bom.status === "discontinued" || Boolean(bom.discontinuedAt)
      ? "discontinued"
      : bom.status || bom.currentRevision?.status || "wait_nvkh";

  const displayLines = isHistorical
    ? (historicalRevision?.lines as BomLineItem[]) || []
    : bom.lines || [];

  const displayCostPerUnit = isHistorical
    ? (historicalRevision?.costPerUnit ?? null)
    : bom.costPerUnit;

  const displayOrderCost = isHistorical ? null : bom.currentOrderCost;

  // BOM của sản phẩm PO đóng băng theo sản phẩm/PO (BE cũng chặn ghi).
  const poBomLockReason =
    bom.type !== "po"
      ? null
      : bom.purchaseOrder?.status === "cancelled"
        ? "Đơn hàng PO đã Hủy"
        : bom.purchaseOrder?.status === "closed"
          ? "Đơn hàng PO đã Khoá"
          : (bom.purchaseOrderProduct?.status ?? bom.product?.status) === "closed"
            ? "Sản phẩm đã Khoá"
            : null;

  const isReadOnlyPoBom = poBomLockReason !== null;

  // Revision switcher handler
  const handleSelectRevision = (revId: string) => {
    const params = new URLSearchParams(searchParams);
    if (revId === bom.currentRevision?.id) {
      params.delete("revision");
    } else {
      params.set("revision", revId);
    }
    setSearchParams(params);
  };

  // Header update handler
  const handleUpdateHeader = async (payload: UpdateBomPayload) => {
    try {
      await updateBomMutation.mutateAsync({ ...payload, expectedRowVersion: bom.rowVersion });
      showToast("Đã cập nhật thông tin Header", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi cập nhật Header", "error");
    }
  };

  // Handlers for Workflow Actions
  const handleForward = async (note?: string) => {
    try {
      await forwardMutation.mutateAsync({ note, expectedRowVersion: bom.rowVersion });
      showToast("Đã chuyển bước thành công", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.status === 409) {
        showToast("Dữ liệu đã bị thay đổi bởi người khác, hệ thống đang tải lại...", "error");
        refetchBom();
      } else {
        showToast(axiosErr?.response?.data?.message || "Lỗi khi chuyển bước", "error");
      }
    }
  };

  const handleReject = async (targetStatus: BomStatus, reason: string) => {
    try {
      await rejectMutation.mutateAsync({
        targetStatus,
        reason,
        expectedRowVersion: bom.rowVersion,
      });
      showToast("Đã trả lại định mức về bước trước", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.status === 409) {
        showToast("Dữ liệu đã bị thay đổi bởi người khác, hệ thống đang tải lại...", "error");
        refetchBom();
      } else {
        showToast(axiosErr?.response?.data?.message || "Lỗi khi trả lại", "error");
      }
    }
  };

  const handleApprove = async (note?: string) => {
    try {
      await approveMutation.mutateAsync({ note, expectedRowVersion: bom.rowVersion });
      showToast("Đã phê duyệt đóng NPL thành công", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.status === 409) {
        showToast("Dữ liệu đã bị thay đổi bởi người khác, hệ thống đang tải lại...", "error");
        refetchBom();
      } else {
        showToast(axiosErr?.response?.data?.message || "Lỗi khi phê duyệt", "error");
      }
    }
  };

  const handleDiscontinue = async (reason: string) => {
    try {
      await discontinueMutation.mutateAsync({ reason, expectedRowVersion: bom.rowVersion });
      showToast("Đã ngừng sử dụng NPL", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.status === 409) {
        showToast("Dữ liệu đã bị thay đổi bởi người khác, hệ thống đang tải lại...", "error");
        refetchBom();
      } else {
        showToast(axiosErr?.response?.data?.message || "Lỗi khi ngừng sử dụng", "error");
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync({ expectedRowVersion: bom.rowVersion });
      showToast("Đã mở khóa và khôi phục sử dụng NPL", "success");
      setIsRestoreConfirmOpen(false);
      refetchBom();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr?.response?.status === 409) {
        showToast("Dữ liệu đã bị thay đổi, hệ thống đang tải lại...", "error");
        refetchBom();
      } else {
        showToast(axiosErr?.response?.data?.message || "Không thể mở khóa NPL", "error");
      }
    }
  };

  const handleCreateRevision = async (changeReason: string) => {
    try {
      await createRevisionMutation.mutateAsync({ changeReason });
      showToast("Đã tạo phiên bản mới thành công", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi tạo phiên bản mới", "error");
    }
  };

  const promoteTarget = promoteTargetId
    ? (revisions || []).find((rev) => rev.id === promoteTargetId)
    : undefined;

  const handlePromote = async (reason: string) => {
    if (!promoteTarget) return;
    await promoteMutation.mutateAsync({ revisionId: promoteTarget.id, payload: { reason } });
    showToast(`Đã đặt phiên bản ${promoteTarget.revisionNo} làm phiên bản hiện hành`, "success");
    if (searchParams.get("revision")) {
      const params = new URLSearchParams(searchParams);
      params.delete("revision");
      setSearchParams(params);
    }
  };

  const handleCopyFit = async (sourceRevisionId: string) => {
    try {
      await copyFitMutation.mutateAsync({ sourceRevisionId, expectedRowVersion: bom.rowVersion });
      showToast("Đã sao chép thành công định mức từ Fit NPL", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi sao chép từ Fit NPL", "error");
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Main content: shrinks and yields room when drawer is open */}
      <div
        className={`flex min-w-0 flex-col gap-6 transition-all duration-300 ${
          isLineModalOpen ? "lg:mr-[480px]" : ""
        }`}
      >
        {poBomLockReason && (
          <p className="rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            {poBomLockReason}, nên NPL này chỉ ở chế độ <strong>Chỉ đọc</strong>.
          </p>
        )}

        {/* 1. Header & Quick Actions */}
        <BomDetailHeader
          bom={bom}
          readOnly={isReadOnlyPoBom}
          revisions={revisions}
          selectedRevisionId={selectedRevisionParam || bom.currentRevision?.id}
          isHistorical={isHistorical}
          onSelectRevision={handleSelectRevision}
          onOpenEditHeaderModal={() => setIsEditHeaderOpen(true)}
          onOpenForwardModal={() => {
            if (hasUnsavedLines) {
              showToast(
                "Bạn có thay đổi định mức chưa lưu. Vui lòng bấm 'Lưu' trước khi chuyển bước!",
                "error",
              );
              return;
            }
            setIsForwardModalOpen(true);
          }}
          onOpenRejectModal={() => setIsRejectModalOpen(true)}
          onOpenApproveModal={() => setIsApproveModalOpen(true)}
          onOpenCreateRevisionModal={() => setIsCreateRevModalOpen(true)}
          onOpenCopyFitModal={() => setIsCopyFitModalOpen(true)}
          onOpenDiscontinueModal={() => setIsDiscontinueModalOpen(true)}
          onOpenRestoreConfirm={() => setIsRestoreConfirmOpen(true)}
        />

        {/* 2. Workflow State Stepper */}
        <BomWorkflowStepper status={currentStatus} discontinuedAt={bom.discontinuedAt} />

        {/* 3. 4 KPI Summary Cards */}
        <BomDetailKpiCards bom={bom} />

        {/* 4. Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => setActiveTab("lines")}
              className={`cursor-pointer border-b-2 py-3 text-sm font-semibold transition-colors ${
                activeTab === "lines"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Nguyên liệu ({displayLines.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("revisions")}
              className={`cursor-pointer border-b-2 py-3 text-sm font-semibold transition-colors ${
                activeTab === "revisions"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <span>Lịch sử</span>
            </button>

          </div>
        </div>

        {/* 5. Tab Contents */}
        <div className={activeTab === "lines" ? "relative" : "hidden"}>
          {isLoadingHistorical && (
            <div className="text-theme-xs mb-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-gray-500">
              Đang tải dữ liệu của phiên bản lịch sử...
            </div>
          )}
          {(currentStatus === "wait_rd" || currentStatus === "wait_accounting") &&
            !isHistorical &&
            !isReadOnlyPoBom && (
              <p className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                {currentStatus === "wait_rd"
                  ? "Chỉnh sửa hoặc thêm vật tư rồi bấm Lưu để ghi nhận từng phần. Khi đã nhập đủ định mức, dùng Chuyển TPKH ở đầu trang."
                  : "Nhập đơn giá rồi bấm Lưu để ghi nhận từng phần. Khi đã nhập đủ giá, dùng Chuyển SA ở đầu trang."}
              </p>
            )}
          <BomLinesEditor
            bomId={bom.id}
            bomCode={bom.bomCode}
            rowVersion={bom.rowVersion}
            lines={displayLines}
            readOnly={isReadOnlyPoBom}
            currentStatus={currentStatus}
            isHistorical={isHistorical}
            revisionId={activeRevisionId}
            revisionNo={
              isHistorical ? historicalRevision?.revisionNo : bom.currentRevision?.revisionNo
            }
            costPerUnit={displayCostPerUnit}
            currentOrderQuantity={bom.currentOrderQuantity}
            currentOrderCost={displayOrderCost}
            isDrawerOpen={isLineModalOpen}
            onDrawerOpenChange={setIsLineModalOpen}
            showToast={showToast}
            onDirtyChange={setHasUnsavedLines}
          />
        </div>

        {activeTab === "revisions" && (
          <BomRevisionsTab
            bomId={bom.id}
            revisions={revisions || []}
            isLoading={isLoadingRevisions}
            currentRevisionId={bom.currentRevision?.id}
            canPromote={!isReadOnlyPoBom && !bom.discontinuedAt && canPromoteRevision(user)}
            onOpenDiff={(revId) => setDiffModalRevId(revId)}
            onPromote={(revId) => setPromoteTargetId(revId)}
          />
        )}

      </div>

      {/* 6. Modals */}
      <BomHeaderEditModal
        isOpen={isEditHeaderOpen && !isReadOnlyPoBom}
        bom={bom}
        isHistorical={isHistorical}
        onClose={() => setIsEditHeaderOpen(false)}
        onSubmit={handleUpdateHeader}
      />

      <BomForwardModal
        isOpen={isForwardModalOpen && !isReadOnlyPoBom}
        currentStatus={currentStatus}
        onClose={() => setIsForwardModalOpen(false)}
        onSubmit={handleForward}
      />

      <BomRejectModal
        isOpen={isRejectModalOpen && !isReadOnlyPoBom}
        currentStatus={currentStatus}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={handleReject}
      />

      <BomApproveModal
        isOpen={isApproveModalOpen && !isReadOnlyPoBom}
        bomCode={bom.bomCode}
        onClose={() => setIsApproveModalOpen(false)}
        onSubmit={handleApprove}
      />

      <BomDiscontinueModal
        isOpen={isDiscontinueModalOpen && !isReadOnlyPoBom}
        bomCode={bom.bomCode}
        onClose={() => setIsDiscontinueModalOpen(false)}
        onSubmit={handleDiscontinue}
      />

      <ConfirmDialog
        open={isRestoreConfirmOpen && !isReadOnlyPoBom}
        title="Mở khóa NPL"
        description={`Khôi phục sử dụng NPL "${bom.bomCode}"? NPL sẽ quay lại trạng thái theo phiên bản hiện tại.`}
        confirmLabel="Mở khóa"
        closeOnClickOutside
        isSubmitting={restoreMutation.isPending}
        onConfirm={handleRestore}
        onClose={() => setIsRestoreConfirmOpen(false)}
      />

      <BomCreateRevisionModal
        isOpen={isCreateRevModalOpen && !isReadOnlyPoBom}
        currentRevNo={bom.currentRevision?.revisionNo || 1}
        onClose={() => setIsCreateRevModalOpen(false)}
        onSubmit={handleCreateRevision}
      />

      <BomCopyFitModal
        isOpen={isCopyFitModalOpen && !isReadOnlyPoBom}
        styleId={
          bom.style?.id ??
          bom.product?.sourceStyleId ??
          bom.purchaseOrderProduct?.sourceStyleId ??
          undefined
        }
        styleCode={bom.style?.styleCode}
        onClose={() => setIsCopyFitModalOpen(false)}
        onSubmit={handleCopyFit}
      />

      <BomPromoteRevisionModal
        isOpen={Boolean(promoteTarget) && !isReadOnlyPoBom}
        targetRevisionNo={promoteTarget?.revisionNo ?? 0}
        currentRevisionNo={bom.currentRevision?.revisionNo ?? 0}
        currentStatus={bom.currentRevision?.status ?? "closed"}
        onClose={() => setPromoteTargetId(null)}
        onSubmit={handlePromote}
      />

      {diffModalRevId && (
        <BomRevisionDiffModal
          isOpen={Boolean(diffModalRevId)}
          bomId={bom.id}
          revisionId={diffModalRevId}
          onClose={() => setDiffModalRevId(null)}
        />
      )}

      {toast && (
        <Toast
          open={Boolean(toast)}
          message={toast.message}
          variant={toast.variant}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
