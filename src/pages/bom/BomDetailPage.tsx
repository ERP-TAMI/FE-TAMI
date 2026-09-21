import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  RotateCw,
} from "lucide-react";
import {
  useBom,
  useUpdateBom,
  useBomRevisions,
  useBomRevisionDetail,
  useBomRevisionHistory,
  useAddBomLine,
  useUpdateBomLine,
  useDeleteBomLine,
  useReorderBomLines,
  useForwardBom,
  useRejectBom,
  useApproveBom,
  useCreateBomRevision,
  useCopyFitToPoBom,
  useDiscontinueBom,
} from "@/hooks/useBoms";
import { useToast } from "@/hooks/useToast";
import { ConfirmDialog, Toast } from "@/components/shared";
import { useUnsavedChangesWarning } from "@/hooks/useNavigationBlocker";
import type {
  BomLineItem,
  CreateBomLinePayload,
  UpdateBomLinePayload,
  UpdateBomPayload,
  BomStatus,
} from "@/types/bom";

// Components
import { BomDetailHeader } from "@/components/features/bom/detail/BomDetailHeader";
import { BomHeaderEditModal } from "@/components/features/bom/detail/BomHeaderEditModal";
import { BomWorkflowStepper } from "@/components/features/bom/detail/BomWorkflowStepper";
import { BomDetailKpiCards } from "@/components/features/bom/detail/BomDetailKpiCards";
import { BomLinesTable } from "@/components/features/bom/detail/BomLinesTable";
import { BomAddMaterialDrawer } from "@/components/features/bom/detail/BomAddMaterialDrawer";
import { BomLineDeleteDialog } from "@/components/features/bom/detail/BomLineDeleteDialog";
import {
  BomForwardModal,
  BomRejectModal,
  BomApproveModal,
  BomDiscontinueModal,
  BomCreateRevisionModal,
} from "@/components/features/bom/detail/BomWorkflowModals";
import { BomRevisionsTab } from "@/components/features/bom/detail/BomRevisionsTab";
import { BomRevisionDiffModal } from "@/components/features/bom/detail/BomRevisionDiffModal";
import { BomHistoryTab } from "@/components/features/bom/detail/BomHistoryTab";
import { BomAggregateTab } from "@/components/features/bom/detail/BomAggregateTab";
import { BomCopyFitModal } from "@/components/features/bom/detail/BomCopyFitModal";
import { useAuthStore } from "@/store/authStore";
import { canEditTechnicalLines } from "@/lib/bomAccess";
import {
  BomRdEntryTable,
  type RdLineInputState,
} from "@/components/features/bom/detail/BomRdEntryTable";
import { BomRdBottomBar } from "@/components/features/bom/detail/BomRdBottomBar";

type ActiveTab = "lines" | "revisions" | "history" | "aggregate";

export default function BomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const user = useAuthStore((state) => state.user);

  const tabFromUrl = searchParams.get("tab");
  const initialTab: ActiveTab =
    tabFromUrl === "revisions" || tabFromUrl === "history" || tabFromUrl === "aggregate"
      ? tabFromUrl
      : "lines";
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  const selectedRevisionParam = searchParams.get("revision");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "revisions" || t === "history" || t === "aggregate" || t === "lines") {
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
      selectedRevisionParam !== bom.currentRevision.id
  );

  // Query Historical Revision Detail if requested
  const { data: historicalRevision, isLoading: isLoadingHistorical } = useBomRevisionDetail(
    id,
    isHistorical ? selectedRevisionParam! : undefined
  );

  // Query History
  const activeRevisionId = isHistorical
    ? selectedRevisionParam!
    : bom?.currentRevision?.id;

  const { data: history, isLoading: isLoadingHistory } = useBomRevisionHistory(
    id,
    activeRevisionId
  );

  // Mutation Hooks
  const updateBomMutation = useUpdateBom(id || "");
  const addLineMutation = useAddBomLine(id || "");
  const updateLineMutation = useUpdateBomLine(id || "");
  const deleteLineMutation = useDeleteBomLine(id || "");
  const reorderLinesMutation = useReorderBomLines(id || "");
  const forwardMutation = useForwardBom(id || "");
  const rejectMutation = useRejectBom(id || "");
  const approveMutation = useApproveBom(id || "");
  const createRevisionMutation = useCreateBomRevision(id || "");
  const copyFitMutation = useCopyFitToPoBom(id || "");
  const discontinueMutation = useDiscontinueBom(id || "");

  // Modal States
  const [isEditHeaderOpen, setIsEditHeaderOpen] = useState(false);
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BomLineItem | null>(null);
  const [deletingLine, setDeletingLine] = useState<BomLineItem | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDiscontinueModalOpen, setIsDiscontinueModalOpen] = useState(false);
  const [isCreateRevModalOpen, setIsCreateRevModalOpen] = useState(false);
  const [isCopyFitModalOpen, setIsCopyFitModalOpen] = useState(false);
  const [diffModalRevId, setDiffModalRevId] = useState<string | null>(null);

  // R&D Inline inputs state (must be at top level before early returns)
  const [rdInputs, setRdInputs] = useState<Record<string, RdLineInputState>>({});
  const [isSavingRdDraft, setIsSavingRdDraft] = useState(false);
  const [isFinishingRd, setIsFinishingRd] = useState(false);

  // Accounting unsaved state & navigation blocker (must be top-level before early returns)
  const [hasUnsavedAccountingCosts, setHasUnsavedAccountingCosts] = useState(false);
  const blocker = useUnsavedChangesWarning(
    hasUnsavedAccountingCosts,
    "Bạn có các đơn giá vật tư đã thay đổi nhưng chưa bấm 'Lưu nháp'. Vui lòng bấm lưu để không bị mất dữ liệu!"
  );

  // Sync inputs when bom lines change
  const activeBomLines: BomLineItem[] = useMemo(() => {
    return isHistorical
      ? (historicalRevision?.lines as BomLineItem[]) || []
      : bom?.lines || [];
  }, [isHistorical, historicalRevision?.lines, bom?.lines]);

  useEffect(() => {
    if (activeBomLines.length > 0) {
      setRdInputs((prev) => {
        const next = { ...prev };
        activeBomLines.forEach((l) => {
          if (!next[l.id]) {
            next[l.id] = {
              consumption:
                l.consumption && Number(l.consumption) > 0
                  ? String(l.consumption)
                  : "",
              note: l.note || "",
            };
          }
        });
        return next;
      });
    }
  }, [activeBomLines]);

  if (isLoadingBom) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" data-testid="bom-detail-skeleton">
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
      "Không tìm thấy thông tin BOM hoặc phiên làm việc đã hết hạn.";
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
          Không thể tải chi tiết BOM
        </h2>
        <p className="mt-1 max-w-md text-theme-sm text-gray-500 dark:text-gray-400">
          {errorMsg}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/bom")}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2 text-theme-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Về danh sách
          </button>
          <button
            type="button"
            onClick={() => refetchBom()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-theme-sm font-semibold text-white shadow-xs hover:bg-brand-600"
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
    ? historicalRevision?.costPerUnit ?? null
    : bom.costPerUnit;

  const displayOrderCost = isHistorical
    ? null
    : bom.currentOrderCost;

  const isRdEntryMode =
    currentStatus === "wait_rd" &&
    canEditTechnicalLines(user, currentStatus, isHistorical);

  const handleSaveAllAccountingCosts = async (
    updates: { lineId: string; unitCost: number | null }[]
  ) => {
    try {
      await Promise.all(
        updates.map(({ lineId, unitCost }) =>
          updateLineMutation.mutateAsync({ lineId, payload: { unitCost } })
        )
      );
      setHasUnsavedAccountingCosts(false);
      showToast(`Đã lưu thành công ${updates.length} đơn giá vật tư`, "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi lưu đơn giá", "error");
      throw err;
    }
  };

  const handleChangeRdInput = (
    lineId: string,
    field: "consumption" | "note",
    value: string
  ) => {
    setRdInputs((prev) => ({
      ...prev,
      [lineId]: {
        ...(prev[lineId] || { consumption: "", note: "" }),
        [field]: value,
      },
    }));
  };

  const handleCancelRdInputs = () => {
    const resetState: Record<string, RdLineInputState> = {};
    displayLines.forEach((l) => {
      resetState[l.id] = {
        consumption:
          l.consumption && Number(l.consumption) > 0
            ? String(l.consumption)
            : "",
        note: l.note || "",
      };
    });
    setRdInputs(resetState);
    showToast("Đã khôi phục định mức ban đầu", "success");
  };

  const handleSaveRdDraft = async () => {
    setIsSavingRdDraft(true);
    try {
      const updates = displayLines.map(async (line) => {
        const input = rdInputs[line.id];
        if (!input) return;
        const val = parseFloat(input.consumption);
        const parsedConsumption = !isNaN(val) && val >= 0 ? val : 0;
        await updateLineMutation.mutateAsync({
          lineId: line.id,
          payload: {
            consumption: parsedConsumption,
            note: input.note.trim() || undefined,
          },
        });
      });
      await Promise.all(updates);
      showToast("Đã lưu nháp định mức", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi lưu nháp", "error");
    } finally {
      setIsSavingRdDraft(false);
    }
  };

  const handleFinishRd = async () => {
    const unentered = displayLines.filter((line) => {
      const input = rdInputs[line.id];
      const val = input ? parseFloat(input.consumption) : Number(line.consumption);
      return isNaN(val) || val <= 0;
    });

    if (unentered.length > 0) {
      showToast(
        `Còn ${unentered.length} vật tư chưa nhập định mức. Vui lòng nhập đầy đủ trước khi hoàn tất.`,
        "error"
      );
      return;
    }

    setIsFinishingRd(true);
    try {
      const updates = displayLines.map(async (line) => {
        const input = rdInputs[line.id];
        if (!input) return;
        const val = parseFloat(input.consumption);
        await updateLineMutation.mutateAsync({
          lineId: line.id,
          payload: {
            consumption: val,
            note: input.note.trim() || undefined,
          },
        });
      });
      await Promise.all(updates);

      await forwardMutation.mutateAsync({
        note: "Đã hoàn tất nhập định mức",
      });
      showToast("Đã hoàn tất định mức và chuyển TPKH thành công", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi hoàn tất", "error");
    } finally {
      setIsFinishingRd(false);
    }
  };

  const enteredRdCount = displayLines.filter((line) => {
    const input = rdInputs[line.id];
    if (input) {
      const val = parseFloat(input.consumption);
      return !isNaN(val) && val > 0;
    }
    return line.consumption != null && Number(line.consumption) > 0;
  }).length;

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
      await updateBomMutation.mutateAsync(payload);
      showToast("Đã cập nhật thông tin Header", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi cập nhật Header", "error");
    }
  };

  // Handlers for Line CRUD
  const handleOpenAddLine = () => {
    setEditingLine(null);
    setIsLineModalOpen(true);
  };

  const handleOpenEditLine = (line: BomLineItem) => {
    setEditingLine(line);
    setIsLineModalOpen(true);
  };

  const handleCreateLine = async (payload: CreateBomLinePayload) => {
    await addLineMutation.mutateAsync(payload);
    showToast("Đã thêm nguyên phụ liệu vào BOM", "success");
  };

  const handleCreateBatchLines = async (payloads: CreateBomLinePayload[]) => {
    for (const payload of payloads) {
      await addLineMutation.mutateAsync(payload);
    }
    showToast(`Đã thêm ${payloads.length} nguyên phụ liệu vào BOM`, "success");
  };

  const handleUpdateLine = async (payload: UpdateBomLinePayload) => {
    if (!editingLine) return;
    await updateLineMutation.mutateAsync({
      lineId: editingLine.id,
      payload,
    });
    showToast("Đã cập nhật dòng vật tư", "success");
  };

  const handleOpenDeleteLine = (line: BomLineItem) => {
    setDeletingLine(line);
  };

  const handleConfirmDeleteLine = async () => {
    if (!deletingLine) return;
    try {
      await deleteLineMutation.mutateAsync(deletingLine.id);
      showToast("Đã xóa dòng vật tư", "success");
      setDeletingLine(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi xóa", "error");
    }
  };

  const handleReorderLines = async (items: import("@/types/bom").ReorderBomLineItem[]) => {
    try {
      await reorderLinesMutation.mutateAsync({ items });
      showToast("Đã sắp xếp lại thứ tự vật tư", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi khi sắp xếp", "error");
    }
  };

  // Handlers for Workflow Actions
  const handleForward = async (note?: string) => {
    try {
      await forwardMutation.mutateAsync({ note });
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
      await rejectMutation.mutateAsync({ targetStatus, reason });
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
      await approveMutation.mutateAsync({ note });
      showToast("Đã phê duyệt đóng BOM thành công", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi phê duyệt", "error");
    }
  };

  const handleDiscontinue = async (reason: string) => {
    try {
      await discontinueMutation.mutateAsync({ reason });
      showToast("Đã ngừng sử dụng BOM", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi ngừng sử dụng", "error");
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

  const handleCopyFit = async (sourceRevisionId: string) => {
    try {
      await copyFitMutation.mutateAsync({ sourceRevisionId });
      showToast("Đã sao chép thành công định mức từ Fit BOM", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showToast(axiosErr?.response?.data?.message || "Lỗi khi sao chép từ Fit BOM", "error");
    }
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* Main content: shrinks and yields room when drawer is open */}
      <div
        className={`flex flex-col gap-6 p-4 sm:p-6 lg:p-8 transition-all duration-300 min-w-0 ${
          isLineModalOpen ? "lg:mr-[480px]" : ""
        }`}
      >
      {/* 1. Header & Quick Actions */}
      <BomDetailHeader
        bom={bom}
        revisions={revisions}
        selectedRevisionId={selectedRevisionParam || bom.currentRevision?.id}
        isHistorical={isHistorical}
        onSelectRevision={handleSelectRevision}
        onOpenEditHeaderModal={() => setIsEditHeaderOpen(true)}
        onOpenAddLineModal={handleOpenAddLine}
        onOpenForwardModal={() => {
          if (hasUnsavedAccountingCosts) {
            showToast(
              "Bạn có các đơn giá vật tư đã thay đổi nhưng chưa lưu. Vui lòng bấm 'Lưu nháp' trước khi chuyển bước!",
              "error"
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
        onSaveDraft={isRdEntryMode ? handleSaveRdDraft : undefined}
        isSavingDraft={isSavingRdDraft}
      />

      {/* 2. Workflow State Stepper */}
      <BomWorkflowStepper
        status={currentStatus}
        discontinuedAt={bom.discontinuedAt}
      />

      {/* 3. 4 KPI Summary Cards */}
      <BomDetailKpiCards bom={bom} />

      {/* 4. Tabs: Hide visually in RD mode to match mockup, but keep DOM for accessibility */}
      <div className={isRdEntryMode ? "sr-only" : "border-b border-gray-200 dark:border-gray-800"}>
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
            <span className="sr-only">Lịch sử phiên bản</span>
            <span>Lịch sử</span>
          </button>

          {bom.type === "po" && (
            <button
              type="button"
              onClick={() => setActiveTab("aggregate")}
              className={`cursor-pointer border-b-2 py-3 text-sm font-semibold transition-colors ${
                activeTab === "aggregate"
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Tổng hợp
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className="sr-only"
          >
            Nhật ký duyệt
          </button>
        </div>
      </div>

      {/* 5. Tab Contents */}
      {activeTab === "lines" && (
        <div className="relative">
          {isLoadingHistorical && (
            <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-theme-xs text-gray-500">
              Đang tải dữ liệu của revision lịch sử...
            </div>
          )}
          {isRdEntryMode ? (
            <>
              <BomRdEntryTable
                lines={displayLines}
                inputs={rdInputs}
                onChangeInput={handleChangeRdInput}
                onEditLine={handleOpenEditLine}
                isEditingInModal={isLineModalOpen}
              />
              <BomRdBottomBar
                totalCount={displayLines.length}
                enteredCount={enteredRdCount}
                onCancel={handleCancelRdInputs}
                onComplete={handleFinishRd}
                isSubmitting={isFinishingRd}
              />
            </>
          ) : (
            <BomLinesTable
              lines={displayLines}
              currentStatus={currentStatus}
              isHistorical={isHistorical}
              costPerUnit={displayCostPerUnit}
              currentOrderQuantity={bom.currentOrderQuantity}
              currentOrderCost={displayOrderCost}
              onAddLine={handleOpenAddLine}
              onEditLine={handleOpenEditLine}
              onDeleteLine={handleOpenDeleteLine}
              onReorderLines={handleReorderLines}
              isReordering={reorderLinesMutation.isPending}
              onAddLineInline={handleCreateLine}
              onUpdateLineInline={(lineId, payload) =>
                updateLineMutation.mutateAsync({ lineId, payload }).then(() => {
                  showToast("Đã cập nhật dòng vật tư", "success");
                })
              }
              onSaveAllCosts={handleSaveAllAccountingCosts}
              onDirtyStateChange={setHasUnsavedAccountingCosts}
              isEditingInModal={isLineModalOpen}
            />
          )}
        </div>
      )}

      {activeTab === "revisions" && (
        <BomRevisionsTab
          revisions={revisions || []}
          isLoading={isLoadingRevisions}
          currentRevisionId={bom.currentRevision?.id}
          onOpenDiff={(revId) => setDiffModalRevId(revId)}
        />
      )}

      {activeTab === "history" && (
        <BomHistoryTab
          history={history || []}
          isLoading={isLoadingHistory}
        />
      )}

      {activeTab === "aggregate" && bom.type === "po" && (
        <BomAggregateTab bomId={bom.id} />
      )}
      </div>

      {/* 6. Modals */}
      <BomHeaderEditModal
        isOpen={isEditHeaderOpen}
        bom={bom}
        isHistorical={isHistorical}
        onClose={() => setIsEditHeaderOpen(false)}
        onSubmit={handleUpdateHeader}
      />

      <BomAddMaterialDrawer
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        initialLine={editingLine}
        existingLines={displayLines}
        currentStatus={currentStatus}
        isHistorical={isHistorical}
        onSubmitCreate={handleCreateLine}
        onSubmitCreateBatch={handleCreateBatchLines}
        onSubmitUpdate={handleUpdateLine}
      />

      <BomLineDeleteDialog
        isOpen={Boolean(deletingLine)}
        line={deletingLine}
        isSubmitting={deleteLineMutation.isPending}
        onClose={() => setDeletingLine(null)}
        onConfirm={handleConfirmDeleteLine}
      />

      <BomForwardModal
        isOpen={isForwardModalOpen}
        currentStatus={currentStatus}
        onClose={() => setIsForwardModalOpen(false)}
        onSubmit={handleForward}
      />

      <BomRejectModal
        isOpen={isRejectModalOpen}
        currentStatus={currentStatus}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={handleReject}
      />

      <BomApproveModal
        isOpen={isApproveModalOpen}
        bomCode={bom.bomCode}
        onClose={() => setIsApproveModalOpen(false)}
        onSubmit={handleApprove}
      />

      <BomDiscontinueModal
        isOpen={isDiscontinueModalOpen}
        bomCode={bom.bomCode}
        onClose={() => setIsDiscontinueModalOpen(false)}
        onSubmit={handleDiscontinue}
      />

      <BomCreateRevisionModal
        isOpen={isCreateRevModalOpen}
        currentRevNo={bom.currentRevision?.revisionNo || 1}
        onClose={() => setIsCreateRevModalOpen(false)}
        onSubmit={handleCreateRevision}
      />

      <BomCopyFitModal
        isOpen={isCopyFitModalOpen}
        styleId={bom.style?.id}
        styleCode={bom.style?.styleCode}
        onClose={() => setIsCopyFitModalOpen(false)}
        onSubmit={handleCopyFit}
      />

      {diffModalRevId && (
        <BomRevisionDiffModal
          isOpen={Boolean(diffModalRevId)}
          bomId={bom.id}
          revisionId={diffModalRevId}
          onClose={() => setDiffModalRevId(null)}
        />
      )}

      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Dữ liệu chưa lưu"
        description="Bạn có các đơn giá vật tư đã thay đổi nhưng chưa bấm 'Lưu nháp'. Nếu rời khỏi trang lúc này, các thay đổi sẽ bị mất. Vui lòng bấm lưu để không bị mất dữ liệu!"
        confirmLabel="Rời khỏi trang (Bỏ thay đổi)"
        cancelLabel="Tiếp tục chỉnh sửa & Lưu"
        variant="danger"
        onClose={() => {
          if (blocker.state === "blocked") blocker.reset();
        }}
        onConfirm={() => {
          setHasUnsavedAccountingCosts(false);
          if (blocker.state === "blocked") blocker.proceed();
        }}
      />

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
