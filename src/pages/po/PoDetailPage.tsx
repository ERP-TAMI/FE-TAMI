import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageHeader, Toast, Button } from "@/components/shared";
import { PoStatusBadge } from "@/components/features/po/PoStatusBadge";
import { ProductStatusBadge } from "@/components/features/po/ProductStatusBadge";
import { PoReasonModal } from "@/components/features/po/PoReasonModal";
import { PoAddProductModal } from "@/components/features/po/PoAddProductModal";
import { PoDocumentsSection } from "@/components/features/po/PoDocumentsSection";
import { PoAddProductQuickForm } from "@/components/features/po/PoAddProductQuickForm";
import { PoSplitDocumentPreview } from "@/components/features/po/PoSplitDocumentPreview";
import { StyleImagePlaceholder } from "@/components/features/styles/StyleImagePlaceholder";
import { resolveImageUrl } from "@/lib/imageUtils";
import {
  usePurchaseOrder,
  useUpdatePurchaseOrder,
  useUpdatePoStatus,
  useUnlinkPoDocument,
  useUploadPoDocument,
  useUploadPoDocuments,
  useUpdatePoDocumentPurpose,
  usePoProducts,
  useAddPoProduct,
  useRemovePoProduct,
} from "@/hooks/usePurchaseOrders";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { TrashBinIcon, EyeIcon, AngleDownIcon, LockIcon, BoltIcon, BoxIcon, InfoIcon } from "@/icons";
import type {
  CreatePoProductInput,
  PoStatus,
  PurchaseOrderProductItem,
  PurchaseOrderDocumentItem,
} from "@/types/po";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function PoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();

  const { data: po, isLoading, isError } = usePurchaseOrder(id);
  const updateMutation = useUpdatePurchaseOrder();
  const updateStatusMutation = useUpdatePoStatus();
  const unlinkDocMutation = useUnlinkPoDocument();
  const uploadDocMutation = useUploadPoDocument();
  const uploadDocsMutation = useUploadPoDocuments();
  const updateDocPurposeMutation = useUpdatePoDocumentPurpose();
  const { data: productsData } = usePoProducts(id);
  const addProductMutation = useAddPoProduct();
  const removeProductMutation = useRemovePoProduct();

  // Determine active tab from URL path
  const getTabFromPath = (): "general" | "lines" | "documents" | "history" => {
    const p = location.pathname.toLowerCase();
    if (p.includes("/products") || p.includes("/lines")) return "lines";
    if (p.includes("/documents") || p.includes("/files")) return "documents";
    if (p.includes("/history")) return "history";
    return "general";
  };

  const activeTab = getTabFromPath();

  const handleTabClick = (tabKey: "general" | "lines" | "documents" | "history") => {
    if (tabKey === "general") navigate(`/po/${id}/detail`);
    else if (tabKey === "lines") navigate(`/po/${id}/products`);
    else if (tabKey === "documents") navigate(`/po/${id}/documents`);
    else if (tabKey === "history") navigate(`/po/${id}/history`);
  };

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Chế độ xem Tab Sản phẩm: Chia khung 50/50 (true) hoặc Chế độ thường 100% (false) (Mặc định: false - Chế độ thường)
  const [isSplitMode, setIsSplitMode] = useState(false);

  const [splitRatio, setSplitRatio] = useState<number>(50); // Mặc định 50/50

  // Local state cho chế độ xem lịch sử PO tinh gọn
  const [historyViewMode, setHistoryViewMode] = useState<"grouped" | "timeline">("grouped");
  const [expandedHistoryGroups, setExpandedHistoryGroups] = useState<Record<string, boolean>>({});

  const groupedPoHistory = useMemo(() => {
    const rawItems = po?.statusHistory || [];
    const sorted = [...rawItems].sort(
      (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
    );

    const lockItems: typeof rawItems = [];
    const statusItems: typeof rawItems = [];
    const createItems: typeof rawItems = [];
    const otherItems: typeof rawItems = [];

    for (const item of sorted) {
      const act = (item.action || "").toLowerCase();
      const rsn = (item.reason || "").toLowerCase();

      if (
        act === "locked" ||
        act === "unlocked" ||
        act.includes("lock") ||
        rsn.includes("khóa") ||
        rsn.includes("mở khóa")
      ) {
        lockItems.push(item);
      } else if (
        act === "created" ||
        act.includes("tạo") ||
        rsn.includes("khởi tạo")
      ) {
        createItems.push(item);
      } else if (
        item.oldStatus ||
        item.newStatus ||
        act.includes("status") ||
        act.includes("chuyển")
      ) {
        statusItems.push(item);
      } else {
        otherItems.push(item);
      }
    }

    const groups = [];

    if (lockItems.length > 0) {
      groups.push({
        id: "po_lock_group",
        title: "Lịch sử Khóa & Mở khóa đơn hàng PO",
        type: "lock",
        items: lockItems,
        latestTime: lockItems[0].changedAt,
        latestStatus: lockItems[0].newStatus,
        latestReason: lockItems[0].reason,
      });
    }

    if (statusItems.length > 0) {
      groups.push({
        id: "po_status_group",
        title: "Lịch sử chuyển trạng thái xử lý đơn hàng",
        type: "status",
        items: statusItems,
        latestTime: statusItems[0].changedAt,
        latestStatus: statusItems[0].newStatus,
        latestReason: statusItems[0].reason,
      });
    }

    if (createItems.length > 0) {
      groups.push({
        id: "po_create_group",
        title: "Khởi tạo đơn hàng PO",
        type: "create",
        items: createItems,
        latestTime: createItems[0].changedAt,
        latestReason: createItems[0].reason,
      });
    }

    if (otherItems.length > 0) {
      groups.push({
        id: "po_other_group",
        title: "Các hoạt động khác",
        type: "other",
        items: otherItems,
        latestTime: otherItems[0].changedAt,
        latestReason: otherItems[0].reason,
      });
    }

    return groups;
  }, [po?.statusHistory]);
  const isDraggingRef = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const ratio = Math.min(80, Math.max(20, (x / rect.width) * 100));
      setSplitRatio(ratio);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  const handleDividerDoubleClick = useCallback(() => {
    setSplitRatio(50); // Double-click reset về 50/50
  }, []);

  // Chế độ hiển thị danh sách sản phẩm trong ô Sản phẩm: "grid" (thẻ) hoặc "table" (bảng)
  const [productLayout, setProductLayout] = useState<"grid" | "table">("grid");
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [showInlineSplitForm, setShowInlineSplitForm] = useState(false);
  const [quickFormDocIds, setQuickFormDocIds] = useState<string[]>([]);
  const [splitPreviewDoc, setSplitPreviewDoc] = useState<PurchaseOrderDocumentItem | null>(null);

  // Form states for general info edit
  const [customerPoCode, setCustomerPoCode] = useState("");
  const [customerNameSnapshot, setCustomerNameSnapshot] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Reason Modal state
  const [reasonModalState, setReasonModalState] = useState<{
    isOpen: boolean;
    targetStatus: PoStatus;
    title: string;
    actionText: string;
  }>({
    isOpen: false,
    targetStatus: "closed",
    title: "",
    actionText: "",
  });

  const isLocked = po?.status === "closed" || po?.status === "cancelled";

  const startEdit = () => {
    if (!po) return;
    setCustomerPoCode(po.customerPoCode || "");
    setCustomerNameSnapshot(po.customerNameSnapshot || "");
    setReceivedDate(
      po.receivedDate ? new Date(po.receivedDate).toISOString().split("T")[0] : "",
    );
    setNote(po.note || "");
    setIsEditing(true);
  };

  const handleSaveGeneral = async () => {
    if (!po || !id) return;
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          customerPoCode: customerPoCode.trim() || undefined,
          customerNameSnapshot: customerNameSnapshot.trim() || undefined,
          receivedDate: receivedDate || undefined,
          note: note.trim() || undefined,
        },
      });
      showToast("Đã cập nhật thông tin đơn hàng PO thành công.");
      setIsEditing(false);
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Cập nhật đơn hàng PO thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const triggerStatusTransition = async (targetStatus: PoStatus, reason?: string) => {
    if (!po || !id) return;
    try {
      await updateStatusMutation.mutateAsync({
        id,
        input: { status: targetStatus, reason },
      });
      showToast("Đã chuyển trạng thái PO thành công.");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Chuyển trạng thái PO thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleStatusButtonClick = (targetStatus: PoStatus) => {
    if (targetStatus === "closed") {
      setReasonModalState({
        isOpen: true,
        targetStatus: "closed",
        title: "Khóa đơn hàng PO",
        actionText: "Xác nhận Khóa PO",
      });
    } else if (targetStatus === "cancelled") {
      setReasonModalState({
        isOpen: true,
        targetStatus: "cancelled",
        title: "Hủy đơn hàng PO",
        actionText: "Xác nhận Hủy PO",
      });
    } else {
      void triggerStatusTransition(targetStatus);
    }
  };

  const handleAddProduct = async (input: CreatePoProductInput) => {
    if (!id) return;
    try {
      await addProductMutation.mutateAsync({ id, input });
      showToast("Đã thêm sản phẩm vào đơn hàng PO.");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Thêm sản phẩm vào PO thất bại.");
      showToast(apiErr.message, "error");
      throw new Error(apiErr.message);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!id) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng PO?")) return;
    try {
      await removeProductMutation.mutateAsync({ id, productId });
      showToast("Đã xóa sản phẩm khỏi đơn hàng PO.");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Xóa sản phẩm thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleReasonSubmit = async (reason: string) => {
    await triggerStatusTransition(reasonModalState.targetStatus, reason);
  };

  const handleUploadDocument = async (files: File[] | File, purpose: string) => {
    if (!id) return;
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;
    try {
      if (fileList.length === 1) {
        await uploadDocMutation.mutateAsync({ id, file: fileList[0], purpose });
      } else {
        await uploadDocsMutation.mutateAsync({ id, files: fileList, purpose });
      }
      showToast(
        fileList.length === 1
          ? "Đã đính kèm tài liệu vào PO thành công."
          : `Đã đính kèm thành công ${fileList.length} tài liệu vào PO.`,
      );
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Đính kèm tài liệu thất bại.");
      showToast(apiErr.message, "error");
      throw err;
    }
  };

  const handleUnlinkAttachment = async (documentId: string) => {
    if (!id) return;
    try {
      await unlinkDocMutation.mutateAsync({ id, documentId });
      showToast("Đã gỡ liên kết tài liệu khỏi PO.");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Gỡ liên kết tài liệu thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  const handleUpdateDocumentPurpose = async (documentId: string, purpose: string) => {
    if (!id) return;
    try {
      await updateDocPurposeMutation.mutateAsync({ id, documentId, purpose });
      showToast("Đã cập nhật phân loại tài liệu thành công.");
    } catch (err: unknown) {
      const apiErr = getApiError(err, "Cập nhật phân loại tài liệu thất bại.");
      showToast(apiErr.message, "error");
    }
  };

  // Drag & Drop Handlers for Split Screen in Tab Sản phẩm
  const handleDragStart = (e: React.DragEvent, docId: string) => {
    e.dataTransfer.setData("text/plain", docId);
    e.dataTransfer.effectAllowed = "copy";
    setDraggedDocId(docId);
  };

  // Map tất cả assignments: docId -> danh sách sản phẩm { productId, productCode }
  const docAssignmentsMap = useMemo(() => {
    const map: Record<string, { productId: string; productCode: string }[]> = {};
    const prods: PurchaseOrderProductItem[] = productsData || [];
    prods.forEach((prod) => {
      (prod.documents || []).forEach((d) => {
        if (!map[d.documentId]) map[d.documentId] = [];
        if (!map[d.documentId].some((x) => x.productId === prod.id)) {
          map[d.documentId].push({
            productId: prod.id,
            productCode: prod.productCode || prod.styleCode || "SP",
          });
        }
      });
    });
    return map;
  }, [productsData]);

  // Sắp xếp danh sách tài liệu PO:
  // 1. Chưa gán (ưu tiên lên trên)
  // 2. Đã gán với sản phẩm khác (hiển thị phía dưới)
  const sortedPoDocs = useMemo(() => {
    const docs = po?.documents || [];
    return [...docs].sort((a, b) => {
      const aAssigned = (docAssignmentsMap[a.documentId] || []).length > 0;
      const bAssigned = (docAssignmentsMap[b.documentId] || []).length > 0;
      if (aAssigned !== bAssigned) {
        return aAssigned ? 1 : -1; // Chưa gán lên trước
      }
      return 0;
    });
  }, [po?.documents, docAssignmentsMap]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
        Đang tải chi tiết đơn hàng PO...
      </div>
    );
  }

  if (isError || !po) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50 p-8 text-center text-theme-sm text-error-700 dark:border-error-900/40 dark:bg-error-950/30 dark:text-error-300">
        Không tìm thấy đơn hàng PO hoặc có lỗi xảy ra.{" "}
        <button
          type="button"
          onClick={() => navigate("/po")}
          className="font-semibold underline hover:text-error-800"
        >
          Quay lại danh sách PO
        </button>
      </div>
    );
  }

  const lines: PurchaseOrderProductItem[] =
    productsData || po.products || po.lines || [];

  return (
    <div className="space-y-5">
      {toast && (
        <Toast
          open={!!toast}
          message={toast.message}
          variant={toast.variant}
          onClose={hideToast}
        />
      )}

      {/* Breadcrumb Header */}
      <PageHeader
        breadcrumb={[
          { label: "Trang chủ", to: "/" },
          { label: "Quản lý PO", to: "/po" },
          { label: po.poCode },
        ]}
        title="Chi tiết đơn hàng PO"
      />

      {/* Unified PO Header Card */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-6 gap-y-2">
            <div className="flex items-center gap-3 shrink-0">
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight leading-none text-gray-900 dark:text-white">
                {po.poCode}
              </h1>
              <PoStatusBadge status={po.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 shrink-0">
            {po.status === "draft" && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusButtonClick("in_progress")}
                  disabled={updateStatusMutation.isPending}
                >
                  Bắt đầu xử lý PO →
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusButtonClick("cancelled")}
                  disabled={updateStatusMutation.isPending}
                >
                  Hủy PO
                </Button>
              </>
            )}

            {(po.status === "in_progress" || po.status === "pending_rd") && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleStatusButtonClick("closed")}
                  disabled={updateStatusMutation.isPending}
                >
                  Khóa PO
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusButtonClick("cancelled")}
                  disabled={updateStatusMutation.isPending}
                >
                  Hủy PO
                </Button>
              </>
            )}
          </div>
        </div>

        {po.status === "cancelled" && po.cancellationReason && (
          <div className="mt-3 rounded-xl border border-error-200 bg-error-50/70 p-2.5 text-theme-xs font-medium text-error-800 dark:border-error-900/40 dark:bg-error-950/40 dark:text-error-300">
            Đơn hàng đã bị hủy. Lý do: {po.cancellationReason}
          </div>
        )}

        {isLocked && (
          <div className="mt-3 rounded-xl border border-warning-200 bg-warning-50/70 p-2.5 text-theme-xs font-medium text-warning-800 dark:border-warning-900/40 dark:bg-warning-950/40 dark:text-warning-300">
            Đơn hàng PO đã <strong>khóa</strong> vào ngày {formatDate(po.closedAt)}. Mọi thông tin đã được chuyển sang chế độ chỉ đọc.
          </div>
        )}
      </div>

      {/* Tabs Navigation & Split Screen Toggle */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-800 gap-2">
        <nav className="-mb-px flex gap-6 text-theme-sm font-semibold">
          <button
            type="button"
            onClick={() => handleTabClick("general")}
            className={`border-b-2 py-2.5 transition-colors ${activeTab === "general"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
          >
            Thông tin chung
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("lines")}
            className={`border-b-2 py-2.5 transition-colors ${activeTab === "lines"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
          >
            Sản phẩm / Mẫu Fit ({lines.length})
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("documents")}
            className={`border-b-2 py-2.5 transition-colors ${activeTab === "documents"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
          >
            Tài liệu PO ({po.documents?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("history")}
            className={`border-b-2 py-2.5 transition-colors ${activeTab === "history"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
          >
            Lịch sử ({po.statusHistory?.length || 0})
          </button>
        </nav>

        {/* Nút bật/tắt chế độ chia khung 50/50 khi ở tab Sản phẩm / Mẫu Fit */}
        {activeTab === "lines" && (
          <div className="pb-1.5">
            <button
              type="button"
              onClick={() => setIsSplitMode(!isSplitMode)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${isSplitMode
                  ? "bg-brand-600 text-white shadow-xs dark:bg-brand-500"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              title={
                isSplitMode
                  ? "Thoát chế độ chia khung, quay về chế độ xem thường"
                  : "Chế độ chia khung 50/50: Tài liệu PO bên trái, Sản phẩm bên phải"
              }
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M12 3v18" />
              </svg>
              <span>{isSplitMode ? "Thoát chia khung" : "Chia khung 50/50"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Thông tin chung */}
      {activeTab === "general" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-theme-base font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    Thông tin PO
                  </h3>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Chi tiết định danh và thông tin khách hàng của đơn hàng
                  </p>
                </div>
              </div>
              {!isEditing && !isLocked && (
                <Button variant="outline" size="sm" onClick={startEdit}>
                  Chỉnh sửa
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Mã PO Khách hàng
                    </label>
                    <input
                      type="text"
                      value={customerPoCode}
                      onChange={(e) => setCustomerPoCode(e.target.value)}
                      placeholder="Nhập mã PO khách hàng..."
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-theme-base text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Tên Khách hàng
                    </label>
                    <input
                      type="text"
                      value={customerNameSnapshot}
                      onChange={(e) => setCustomerNameSnapshot(e.target.value)}
                      placeholder="Nhập tên khách hàng..."
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-theme-base text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Ngày nhận đơn
                    </label>
                    <input
                      type="date"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-theme-base text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Ghi chú
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Thêm ghi chú đơn hàng..."
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white p-3.5 text-theme-base text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    disabled={updateMutation.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveGeneral}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 dark:border-gray-800 dark:bg-gray-800/40">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Mã PO nội bộ
                  </span>
                  <span className="mt-2 block font-mono text-xl sm:text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
                    {po.poCode}
                  </span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 dark:border-gray-800 dark:bg-gray-800/40">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Khách hàng
                  </span>
                  <span
                    className="mt-2 block text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate"
                    title={po.customerNameSnapshot}
                  >
                    {po.customerNameSnapshot}
                  </span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 dark:border-gray-800 dark:bg-gray-800/40">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Mã PO khách hàng
                  </span>
                  <span className="mt-2 block font-mono text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {po.customerPoCode || "—"}
                  </span>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 dark:border-gray-800 dark:bg-gray-800/40">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Ngày nhận đơn
                  </span>
                  <span className="mt-2 block text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {formatDate(po.receivedDate)}
                  </span>
                </div>

                {po.closedAt && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-xl border border-success-200/80 bg-success-50/60 p-4.5 dark:border-success-900/40 dark:bg-success-950/30">
                    <span className="block text-theme-xs font-semibold uppercase tracking-wider text-success-600 dark:text-success-400">
                      Thời điểm khóa đơn hàng
                    </span>
                    <span className="mt-1.5 block font-bold text-success-800 dark:text-success-200 text-base">
                      {formatDateTime(po.closedAt)}
                    </span>
                  </div>
                )}

                {po.cancellationReason && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-xl border border-error-200/80 bg-error-50/60 p-4.5 dark:border-error-900/40 dark:bg-error-950/30">
                    <span className="block text-theme-xs font-semibold uppercase tracking-wider text-error-600 dark:text-error-400">
                      Lý do hủy đơn hàng
                    </span>
                    <p className="mt-1.5 font-medium text-error-800 dark:text-error-200 text-theme-base">
                      {po.cancellationReason}
                    </p>
                  </div>
                )}

                <div className="col-span-1 sm:col-span-2 lg:col-span-4 rounded-xl border border-gray-100 bg-gray-50/40 p-4.5 dark:border-gray-800 dark:bg-gray-800/30">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Ghi chú đơn hàng
                  </span>
                  <p className="mt-2 text-theme-base leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {po.note || "Chưa có ghi chú cho đơn hàng này."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Sản phẩm / Mẫu Fit */}
      {activeTab === "lines" && (
        isSplitMode ? (
          <div ref={splitContainerRef} className="flex gap-0 min-h-[780px]">
            {/* CỘT TRÁI (50%): TÀI LIỆU PO */}
            {(() => {
              const allDocs = po?.documents || [];
              const unassignedList = sortedPoDocs.filter(
                (d) => !(docAssignmentsMap[d.documentId] || []).length,
              );
              const assignedList = sortedPoDocs.filter(
                (d) => (docAssignmentsMap[d.documentId] || []).length > 0,
              );

              return (
                <div style={{ width: `${splitRatio}%` }} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 flex flex-col h-[780px] shrink-0">
                  {splitPreviewDoc ? (
                    /* ─── XEM TRƯỚC TÀI LIỆU CHỈ TRONG Ô BÊN TRÁI ─── */
                    <PoSplitDocumentPreview
                      poId={id!}
                      document={splitPreviewDoc}
                      onBack={() => setSplitPreviewDoc(null)}
                      onAttachToQuickForm={
                        showInlineSplitForm
                          ? (docId) => {
                            if (!quickFormDocIds.includes(docId)) {
                              setQuickFormDocIds([...quickFormDocIds, docId]);
                            }
                          }
                          : undefined
                      }
                      isSelectedInQuickForm={quickFormDocIds.includes(splitPreviewDoc.documentId)}
                    />
                  ) : (
                    <>
                      {/* Header tài liệu PO */}
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800 shrink-0">
                        <div>
                          <h3 className="text-theme-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                            Tài liệu PO ({allDocs.length})
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {showInlineSplitForm
                              ? "Kéo thả sang form bên phải để gán tài liệu"
                              : "Kéo thả sang sản phẩm bên phải để gán tài liệu"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300">
                            {unassignedList.length} chưa gán
                          </span>
                          {assignedList.length > 0 && (
                            <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-gray-800 dark:border-gray-700">
                              {assignedList.length} đã gán
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Danh sách tài liệu PO */}
                      <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1">
                        {allDocs.length === 0 ? (
                          <div className="p-8 text-center text-theme-xs text-gray-400 italic">
                            Chưa có tài liệu nào trong PO. Tải lên tại tab "Tài liệu PO".
                          </div>
                        ) : (
                          <>
                            {/* NHÓM 1: TÀI LIỆU CHƯA GÁN (ƯU TIÊN LÊN TRÊN) */}
                            {unassignedList.length > 0 && (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    Chưa gán ({unassignedList.length})
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Kéo sang phải để gán
                                  </span>
                                </div>
                                {unassignedList.map((doc) => {
                                  const isDraggingThis = draggedDocId === doc.documentId;
                                  const isSelectedInQuickForm = quickFormDocIds.includes(doc.documentId);

                                  return (
                                    <div
                                      key={doc.documentId}
                                      draggable="true"
                                      onDragStart={(e) => handleDragStart(e, doc.documentId)}
                                      onDragEnd={() => setDraggedDocId(null)}
                                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing shadow-2xs group ${isDraggingThis
                                          ? "border-brand-300 bg-brand-50/40 opacity-60 dark:border-brand-800 dark:bg-brand-950/20"
                                          : isSelectedInQuickForm
                                            ? "border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/30"
                                            : "border-gray-200 bg-white hover:bg-brand-50/40 hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-brand-500"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        {isSelectedInQuickForm ? (
                                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-xs shadow-xs">
                                            ✓
                                          </div>
                                        ) : (
                                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <span className="block text-xs font-semibold text-gray-900 dark:text-white truncate">
                                            {doc.title || doc.fileName || doc.documentCode || "Tài liệu"}
                                          </span>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-gray-400 font-mono uppercase">
                                              {doc.purpose}
                                            </span>
                                            {isSelectedInQuickForm && (
                                              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                Đang gán
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="shrink-0 ml-2 flex items-center gap-1.5">
                                        {/* Nút Xem trước riêng trong cột trái */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSplitPreviewDoc(doc);
                                          }}
                                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition cursor-pointer"
                                          title="Xem trước tài liệu ở ô bên trái"
                                        >
                                          <EyeIcon className="h-3 w-3" />
                                          <span>Xem</span>
                                        </button>

                                        {isSelectedInQuickForm ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:border-emerald-700 dark:text-emerald-200">
                                            Đang gán
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300">
                                            Kéo để gán
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* NHÓM 2: TÀI LIỆU ĐÃ GÁN (HIỂN THỊ PHÍA DƯỚI) */}
                            {assignedList.length > 0 && (
                              <div className="space-y-1.5 pt-2">
                                <div className="flex items-center justify-between px-1">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Đã gán ({assignedList.length})
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Có thể kéo gán thêm SP
                                  </span>
                                </div>
                                {assignedList.map((doc) => {
                                  const assignments = docAssignmentsMap[doc.documentId] || [];
                                  const isDraggingThis = draggedDocId === doc.documentId;

                                  return (
                                    <div
                                      key={doc.documentId}
                                      draggable="true"
                                      onDragStart={(e) => handleDragStart(e, doc.documentId)}
                                      onDragEnd={() => setDraggedDocId(null)}
                                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing group ${isDraggingThis
                                          ? "border-brand-300 bg-brand-50/40 opacity-60 dark:border-brand-800 dark:bg-brand-950/20"
                                          : "border-gray-200/80 bg-gray-50/40 hover:bg-gray-100/70 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800/30"
                                        }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                            {doc.title || doc.fileName || doc.documentCode || "Tài liệu"}
                                          </span>
                                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            <span className="text-[10px] text-gray-400 font-mono uppercase">
                                              {doc.purpose}
                                            </span>
                                            {assignments.map((a) => (
                                              <span
                                                key={a.productId}
                                                className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-300"
                                                title={`Đã gán cho sản phẩm ${a.productCode}`}
                                              >
                                                SP: {a.productCode}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="shrink-0 ml-2 flex items-center gap-1.5">
                                        {/* Nút Xem trước riêng trong cột trái */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSplitPreviewDoc(doc);
                                          }}
                                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition cursor-pointer"
                                          title="Xem trước tài liệu ở ô bên trái"
                                        >
                                          <EyeIcon className="h-3 w-3" />
                                          <span>Xem</span>
                                        </button>
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                                          Đã gán ({assignments.length})
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* ─── DRAG DIVIDER ─── */}
            <div
              className="w-2 shrink-0 cursor-col-resize flex items-center justify-center group hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors rounded"
              onMouseDown={handleDividerMouseDown}
              onDoubleClick={handleDividerDoubleClick}
              title="Kéo để thay đổi tỉ lệ • Nhấn đúp để reset 50/50"
            >
              <div className="w-0.5 h-12 bg-gray-300 group-hover:bg-brand-500 dark:bg-gray-600 dark:group-hover:bg-brand-400 rounded-full transition-colors" />
            </div>

            {/* CỘT PHẢI: SẢN PHẨM PO */}
            <div style={{ width: `${100 - splitRatio}%` }} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 flex flex-col h-[780px] shrink-0">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800 shrink-0">
                <div>
                  <h3 className="text-theme-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Sản phẩm PO ({lines.length})
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Danh sách sản phẩm trong đơn hàng PO
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* 2 dạng grid, table với icon phù hợp */}
                  {!showInlineSplitForm && lines.length > 0 && (
                    <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80">
                      <button
                        type="button"
                        onClick={() => setProductLayout("grid")}
                        className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${productLayout === "grid"
                            ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-700 dark:text-brand-400"
                            : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                          }`}
                        title="Dạng thẻ lưới (Grid)"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1.5" />
                          <rect x="14" y="3" width="7" height="7" rx="1.5" />
                          <rect x="3" y="14" width="7" height="7" rx="1.5" />
                          <rect x="14" y="14" width="7" height="7" rx="1.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductLayout("table")}
                        className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${productLayout === "table"
                            ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-700 dark:text-brand-400"
                            : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                          }`}
                        title="Dạng bảng (Table)"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {!isLocked && (
                    showInlineSplitForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickFormDocIds([]);
                          setShowInlineSplitForm(false);
                        }}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
                      >
                        ← Danh sách SP
                      </button>
                    ) : (
                      <Button size="sm" onClick={() => setShowInlineSplitForm(true)}>
                        + Thêm SP
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-3 pr-1">
                {showInlineSplitForm ? (
                  /* ─── INLINE FORM THÊM SẢN PHẨM ─────────────────────────────────── */
                  <PoAddProductQuickForm
                    isPending={addProductMutation.isPending}
                    poDocuments={po?.documents || []}
                    onAttachedDocsChange={setQuickFormDocIds}
                    onClose={() => {
                      setQuickFormDocIds([]);
                      setShowInlineSplitForm(false);
                    }}
                    onSubmit={async (input) => {
                      await handleAddProduct(input);
                      setQuickFormDocIds([]);
                      setShowInlineSplitForm(false);
                    }}
                  />
                ) : lines.length === 0 ? (
                  <div className="p-8 text-center text-theme-xs text-gray-400 italic">
                    Chưa có sản phẩm nào trong PO. Nhấn "+ Thêm SP" ở trên để tạo mới.
                  </div>
                ) : productLayout === "grid" ? (
                  /* ─── DẠNG GRID (THẺ SẢN PHẨM TỈ LỆ 3*4) ────────────────────────── */
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {lines.map((line) => {
                      const resolvedImg = resolveImageUrl(line.structureImageVersionId);
                      return (
                        <div
                          key={line.id}
                          onClick={() => navigate(`/po/${id}/products/${line.id}`)}
                          className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white hover:border-brand-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50 shadow-2xs transition-all cursor-pointer p-2.5"
                        >
                          {/* Khung ảnh tỉ lệ 3*4 (aspect-[3/4]) */}
                          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/60 flex items-center justify-center">
                            {resolvedImg ? (
                              <img
                                src={resolvedImg}
                                alt={line.productName}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-3 text-center">
                                <StyleImagePlaceholder className="h-16 w-16 text-gray-300 dark:text-gray-600 opacity-60 transition-transform duration-200 group-hover:scale-105" />
                              </div>
                            )}

                            {/* Floating Badges trên khung 3*4 */}
                            <div className="absolute top-2 right-2 flex items-start justify-end pointer-events-none">
                              <div className="pointer-events-auto">
                                <ProductStatusBadge status={line.status} />
                              </div>
                            </div>

                            {!isLocked && (
                              <div className="absolute bottom-2 right-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleRemoveProduct(line.id);
                                  }}
                                  disabled={removeProductMutation.isPending}
                                  className="rounded-md bg-white/90 p-1 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:bg-gray-900/90 dark:hover:bg-error-950/40 dark:hover:text-error-400 shadow-2xs border border-gray-200/60 dark:border-gray-700/60 transition cursor-pointer"
                                  title="Xóa khỏi PO"
                                >
                                  <TrashBinIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Thông tin sản phẩm: Mã chủ đạo, tên phụ */}
                          <div className="mt-2.5 space-y-1">
                            <span className="font-mono text-lg font-bold text-brand-600 group-hover:text-brand-700 dark:text-brand-400 truncate block">
                              {line.productCode || line.styleCode}
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={line.productName}>
                              {line.productName}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                              <span className="truncate max-w-[80px]">{line.category || "—"}</span>
                              <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                                {line.totalQuantity ? `${line.totalQuantity.toLocaleString()} pcs` : "—"}
                              </span>
                              {line.deadline && <span>{formatDate(line.deadline)}</span>}
                            </div>
                            {line.colors && line.colors.length > 0 && (
                              <div className="flex items-center gap-1 pt-0.5 overflow-hidden">
                                <span className="text-[10px] text-gray-400 shrink-0">{line.colors.length} màu:</span>
                                <div className="flex items-center gap-1 overflow-x-auto">
                                  {line.colors.slice(0, 4).map((c, i) => (
                                    <span
                                      key={i}
                                      className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                                      style={{ backgroundColor: c.colorCode || "#94a3b8" }}
                                      title={c.colorName}
                                    />
                                  ))}
                                  {line.colors.length > 4 && (
                                    <span className="text-[9px] text-gray-400 font-mono">+{line.colors.length - 4}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* ─── DẠNG TABLE (BẢNG SẢN PHẨM COMPACT) ────────────────────────── */
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/40">
                    <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                      <thead className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                        <tr>
                          <th className="px-3 py-2.5">Mã SP</th>
                          <th className="px-3 py-2.5">Tên SP</th>
                          <th className="px-2.5 py-2.5 text-right">SL (pcs)</th>
                          <th className="px-3 py-2.5">Nguồn Fit</th>
                          <th className="px-3 py-2.5">Hạn giao</th>
                          <th className="px-3 py-2.5 text-right">Trạng thái</th>
                          {!isLocked && <th className="w-10 px-2 py-2.5"></th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {lines.map((line) => (
                          <tr
                            key={line.id}
                            onClick={() => navigate(`/po/${id}/products/${line.id}`)}
                            className="transition-colors hover:bg-brand-50/50 dark:hover:bg-gray-800/60 cursor-pointer group"
                          >
                            <td className="px-3 py-3 font-mono font-bold text-base text-brand-600 group-hover:text-brand-700 dark:text-brand-400">
                              {line.productCode || line.styleCode}
                            </td>
                            <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]" title={line.productName}>
                              {line.productName}
                            </td>
                            <td className="px-2.5 py-3 text-right font-mono font-bold text-xs text-gray-800 dark:text-gray-200">
                              {line.totalQuantity ? line.totalQuantity.toLocaleString() : "—"}
                            </td>
                            <td className="px-3 py-3">
                              {line.sourceStyle ? (
                                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                                  {line.sourceStyle.styleCode}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-[11px] text-gray-500">
                              {formatDate(line.deadline)}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <ProductStatusBadge status={line.status} />
                            </td>
                            {!isLocked && (
                              <td className="px-2 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleRemoveProduct(line.id);
                                  }}
                                  disabled={removeProductMutation.isPending}
                                  className="rounded-lg p-1 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950/40 dark:hover:text-error-400 transition-colors cursor-pointer"
                                  title="Xóa khỏi PO"
                                >
                                  <TrashBinIcon className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ─── CHẾ ĐỘ THƯỜNG (TOÀN MÀN HÌNH 100% WIDTH) ─── */
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            {/* Header chế độ thường */}
            <div className="flex flex-wrap items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800 gap-3">
              <div>
                <h3 className="text-theme-base font-bold text-gray-900 dark:text-white">
                  Danh sách sản phẩm trong đơn hàng PO ({lines.length})
                </h3>
                <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                  Quản lý các dòng sản phẩm, Mẫu Fit và tiến độ sản xuất theo PO
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {/* Toggle Grid / Table */}
                {lines.length > 0 && (
                  <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80">
                    <button
                      type="button"
                      onClick={() => setProductLayout("grid")}
                      className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${productLayout === "grid"
                          ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-700 dark:text-brand-400"
                          : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                        }`}
                      title="Dạng thẻ lưới (Grid 3*4)"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="7" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductLayout("table")}
                      className={`p-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${productLayout === "table"
                          ? "bg-white text-brand-600 shadow-2xs dark:bg-gray-700 dark:text-brand-400"
                          : "text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
                        }`}
                      title="Dạng bảng (Table)"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                    </button>
                  </div>
                )}

                {!isLocked && (
                  <Button size="sm" onClick={() => setIsAddProductOpen(true)}>
                    + Thêm SP
                  </Button>
                )}
              </div>
            </div>

            {/* Nội dung danh sách sản phẩm toàn màn hình */}
            <div className="mt-5">
              {lines.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-theme-base font-semibold text-gray-900 dark:text-white">
                    Chưa có sản phẩm nào thuộc đơn hàng PO này.
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                    Thêm mẫu sản phẩm từ danh mục Mẫu Fit hoặc nhập thủ công để bắt đầu quản lý.
                  </p>
                  {!isLocked && (
                    <div className="mt-4">
                      <Button size="sm" onClick={() => setIsAddProductOpen(true)}>
                        + Thêm sản phẩm ngay
                      </Button>
                    </div>
                  )}
                </div>
              ) : productLayout === "grid" ? (
                /* Dạng Grid 3*4 toàn màn hình */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {lines.map((line) => {
                    const resolvedImg = resolveImageUrl(line.structureImageVersionId);
                    return (
                      <div
                        key={line.id}
                        onClick={() => navigate(`/po/${id}/products/${line.id}`)}
                        className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white hover:border-brand-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50 shadow-2xs transition-all cursor-pointer p-2.5"
                      >
                        {/* Khung ảnh 3*4 */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800/70 border border-gray-100 dark:border-gray-700/60 flex items-center justify-center">
                          {resolvedImg ? (
                            <img
                              src={resolvedImg}
                              alt={line.productName}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-center">
                              <StyleImagePlaceholder className="h-16 w-16 text-gray-300 dark:text-gray-600 opacity-60 transition-transform duration-200 group-hover:scale-105" />
                            </div>
                          )}

                          {/* Floating Badges */}
                          <div className="absolute top-2 right-2 flex items-start justify-end pointer-events-none">
                            <div className="pointer-events-auto">
                              <ProductStatusBadge status={line.status} />
                            </div>
                          </div>

                          {!isLocked && (
                            <div className="absolute bottom-2 right-2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleRemoveProduct(line.id);
                                }}
                                disabled={removeProductMutation.isPending}
                                className="rounded-md bg-white/90 p-1 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:bg-gray-900/90 dark:hover:bg-error-950/40 dark:hover:text-error-400 shadow-2xs border border-gray-200/60 dark:border-gray-700/60 transition cursor-pointer"
                                title="Xóa khỏi PO"
                              >
                                <TrashBinIcon className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Thông tin sản phẩm: Mã chủ đạo, tên phụ */}
                        <div className="mt-2.5 space-y-1">
                          <span className="font-mono text-lg font-bold text-brand-600 group-hover:text-brand-700 dark:text-brand-400 truncate block">
                            {line.productCode || line.styleCode}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={line.productName}>
                            {line.productName}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 pt-0.5">
                            <span className="truncate max-w-[90px]">{line.category || "—"}</span>
                            <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                              {line.totalQuantity ? `${line.totalQuantity.toLocaleString()} pcs` : "—"}
                            </span>
                            {line.deadline && <span>{formatDate(line.deadline)}</span>}
                          </div>
                          {line.colors && line.colors.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5 overflow-hidden">
                              <span className="text-[10px] text-gray-400 shrink-0">{line.colors.length} màu:</span>
                              <div className="flex items-center gap-1 overflow-x-auto">
                                {line.colors.slice(0, 5).map((c, i) => (
                                  <span
                                    key={i}
                                    className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                                    style={{ backgroundColor: c.colorCode || "#94a3b8" }}
                                    title={c.colorName}
                                  />
                                ))}
                                {line.colors.length > 5 && (
                                  <span className="text-[9px] text-gray-400 font-mono">+{line.colors.length - 5}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Dạng Table toàn màn hình */
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/40">
                  <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                    <thead className="border-b border-gray-200 bg-gray-50/80 text-theme-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                      <tr>
                        <th className="px-5 py-3.5">Mã SP</th>
                        <th className="px-5 py-3.5">Tên SP</th>
                        <th className="px-5 py-3.5 text-right">Số lượng (pcs)</th>
                        <th className="px-5 py-3.5">Mẫu Fit nguồn</th>
                        <th className="px-5 py-3.5">Danh mục</th>
                        <th className="px-5 py-3.5">Hạn giao</th>
                        <th className="px-5 py-3.5 text-right">Trạng thái</th>
                        {!isLocked && <th className="w-12 px-3 py-3.5"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {lines.map((line) => (
                        <tr
                          key={line.id}
                          onClick={() => navigate(`/po/${id}/products/${line.id}`)}
                          className="transition-colors hover:bg-brand-50/50 dark:hover:bg-gray-800/60 cursor-pointer group"
                        >
                          <td className="px-5 py-4 font-mono font-bold text-base text-brand-600 group-hover:text-brand-700 dark:text-brand-400">
                            {line.productCode || line.styleCode}
                          </td>
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                            {line.productName}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400 block">
                              {line.totalQuantity ? `${line.totalQuantity.toLocaleString()} pcs` : "—"}
                            </span>
                            {line.colors && line.colors.length > 0 && (
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                {line.colors.slice(0, 3).map((c, i) => (
                                  <span
                                    key={i}
                                    className="w-2 h-2 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                                    style={{ backgroundColor: c.colorCode || "#94a3b8" }}
                                    title={c.colorName}
                                  />
                                ))}
                                <span className="text-[10px] text-gray-400 font-normal">({line.colors.length} màu)</span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            {line.sourceStyle ? (
                              <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 border border-brand-100 dark:border-brand-900">
                                {line.sourceStyle.styleCode}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Thủ công</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                            {line.category || "—"}
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(line.deadline)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <ProductStatusBadge status={line.status} />
                          </td>
                          {!isLocked && (
                            <td className="px-3 py-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleRemoveProduct(line.id);
                                }}
                                disabled={removeProductMutation.isPending}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950/40 dark:hover:text-error-400 transition-colors cursor-pointer"
                                title="Xóa khỏi PO"
                              >
                                <TrashBinIcon className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Tab 3: Tài liệu PO */}
      {activeTab === "documents" && (
        <PoDocumentsSection
          poId={id}
          documents={po.documents || []}
          isLocked={isLocked}
          isPending={
            uploadDocMutation.isPending ||
            uploadDocsMutation.isPending ||
            unlinkDocMutation.isPending ||
            updateDocPurposeMutation.isPending
          }
          onUpload={handleUploadDocument}
          onUnlink={handleUnlinkAttachment}
          onUpdatePurpose={handleUpdateDocumentPurpose}
        />
      )}

      {/* Tab 4: Lịch sử */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Nhật ký chuyển trạng thái & lịch sử đơn hàng</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-600 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-900">
                  {po.statusHistory?.length || 0} bản ghi
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Các sự kiện được tự động gom nhóm tinh gọn theo từng loại thao tác chung, bấm mở rộng để xem chi tiết
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50/80 p-1 dark:border-gray-700 dark:bg-gray-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode("grouped")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyViewMode === "grouped"
                      ? "bg-white text-brand-600 shadow-xs font-semibold dark:bg-gray-700 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Gom nhóm tinh gọn
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryViewMode("timeline")}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyViewMode === "timeline"
                      ? "bg-white text-brand-600 shadow-xs font-semibold dark:bg-gray-700 dark:text-brand-400"
                      : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Dòng thời gian
                </button>
              </div>

              {historyViewMode === "grouped" && groupedPoHistory.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium text-gray-700 border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  onClick={() => {
                    const allExpanded = groupedPoHistory.every((g) => expandedHistoryGroups[g.id]);
                    const next: Record<string, boolean> = {};
                    groupedPoHistory.forEach((g) => {
                      next[g.id] = !allExpanded;
                    });
                    setExpandedHistoryGroups(next);
                  }}
                >
                  {groupedPoHistory.every((g) => expandedHistoryGroups[g.id])
                    ? "Thu gọn tất cả"
                    : "Mở rộng tất cả"}
                </Button>
              )}
            </div>
          </div>

          {(po.statusHistory || []).length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 italic bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
              Chưa có thông tin lịch sử cho đơn hàng này.
            </div>
          ) : historyViewMode === "grouped" ? (
            <div className="space-y-3">
              {groupedPoHistory.map((group) => {
                const isExpanded = Boolean(expandedHistoryGroups[group.id]);
                return (
                  <div
                    key={group.id}
                    className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900 transition-all overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHistoryGroups((prev) => ({
                          ...prev,
                          [group.id]: !prev[group.id],
                        }))
                      }
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                            group.type === "lock"
                              ? "bg-brand-50 text-brand-600 border border-brand-200/80 dark:bg-brand-950/50 dark:text-brand-400 dark:border-brand-900/60"
                              : group.type === "status"
                              ? "bg-blue-50 text-blue-600 border border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60"
                              : group.type === "create"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60"
                              : "bg-gray-100 text-gray-700 border border-gray-200/80 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                          }`}
                        >
                          {group.type === "lock" ? (
                            <LockIcon className="w-5 h-5" />
                          ) : group.type === "status" ? (
                            <BoltIcon className="w-5 h-5" />
                          ) : group.type === "create" ? (
                            <BoxIcon className="w-5 h-5" />
                          ) : (
                            <InfoIcon className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                              {group.title}
                            </h4>
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                              {group.items.length} lần ghi nhận
                            </span>
                            {group.latestStatus && (
                              <PoStatusBadge status={group.latestStatus} showDot={false} />
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-400 dark:text-gray-500 mt-1">
                            <span>Lần gần nhất: {formatDateTime(group.latestTime)}</span>
                            {group.latestReason && (
                              <>
                                <span>•</span>
                                <span className="italic text-gray-600 dark:text-gray-400 truncate max-w-md">
                                  "{group.latestReason}"
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                        </span>
                        <div
                          className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          <AngleDownIcon className="w-4 h-4" />
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20">
                        <div className="relative pl-5 border-l-2 border-brand-500/60 ml-2 mt-3 space-y-4">
                          {group.items.map((item) => (
                            <div key={item.id} className="relative">
                              <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                                      {item.action === "locked"
                                        ? "Khóa đơn hàng PO"
                                        : item.action === "unlocked"
                                        ? "Mở khóa đơn hàng PO"
                                        : item.action === "created"
                                        ? "Khởi tạo PO"
                                        : item.action}
                                    </span>
                                    {item.oldStatus && (
                                      <>
                                        <PoStatusBadge status={item.oldStatus} showDot={false} />
                                        <span className="text-gray-400 text-xs">→</span>
                                      </>
                                    )}
                                    {item.newStatus && (
                                      <PoStatusBadge status={item.newStatus} showDot={false} />
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-gray-400">
                                    {formatDateTime(item.changedAt)}
                                  </span>
                                </div>

                                {item.reason && (
                                  <div className="rounded-xl bg-white p-2.5 text-xs text-gray-700 border border-gray-200/80 shadow-2xs dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                    <span className="font-semibold text-gray-900 dark:text-white mr-1.5">
                                      Lý do:
                                    </span>
                                    {item.reason}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 space-y-6">
                {(po.statusHistory || []).map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 ring-4 ring-white dark:ring-gray-900" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900 dark:text-white">
                          {item.action}
                        </span>
                        {item.oldStatus && (
                          <>
                            <PoStatusBadge status={item.oldStatus} showDot={false} />
                            <span className="text-gray-400">→</span>
                          </>
                        )}
                        <PoStatusBadge status={item.newStatus} showDot={false} />
                        <span className="text-[10px] text-gray-400 ml-auto font-mono">
                          {formatDateTime(item.changedAt)}
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl">
                          <strong>Lý do:</strong> {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


      {/* Reason Modal Dialog */}
      <PoReasonModal
        isOpen={reasonModalState.isOpen}
        title={reasonModalState.title}
        actionText={reasonModalState.actionText}
        isPending={updateStatusMutation.isPending}
        onClose={() => setReasonModalState((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleReasonSubmit}
      />

      {/* Add Product Modal Dialog */}
      <PoAddProductModal
        isOpen={isAddProductOpen}
        isPending={addProductMutation.isPending}
        poDocuments={po.documents || []}
        onClose={() => setIsAddProductOpen(false)}
        onSubmit={handleAddProduct}
      />
    </div>
  );
}
