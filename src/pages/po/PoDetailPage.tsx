import { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PageHeader, Toast, Button, ConfirmDialog } from "@/components/shared";
import { PoStatusBadge } from "@/components/features/po/PoStatusBadge";
import { ProductStatusBadge } from "@/components/features/po/ProductStatusBadge";
import { PoReasonModal } from "@/components/features/po/PoReasonModal";
import { PoAddProductModal } from "@/components/features/po/PoAddProductModal";
import { PoDocumentsSection } from "@/components/features/po/PoDocumentsSection";
import { PoAddProductQuickForm } from "@/components/features/po/PoAddProductQuickForm";
import { PoSplitDocumentPreview } from "@/components/features/po/PoSplitDocumentPreview";
import { StyleImagePlaceholder } from "@/components/features/styles/StyleImagePlaceholder";
import {
  usePurchaseOrder,
  useUpdatePurchaseOrder,
  useUpdatePoStatus,
  useUnlinkPoDocument,
  useUploadPoDocument,
  useUploadPoDocuments,
  useUpdatePoDocumentPurpose,
  usePoProducts,
  usePoDocuments,
  useAddPoProduct,
  useRemovePoProduct,
  useDeletePurchaseOrder,
} from "@/hooks/usePurchaseOrders";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { TrashBinIcon, EyeIcon, CalenderIcon } from "@/icons";
import type {
  CreatePoProductInput,
  PoStatus,
  PurchaseOrderProductItem,
  PurchaseOrderDocumentItem,
} from "@/types/po";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN", DATE_FORMAT_OPTIONS);
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.toLocaleDateString("vi-VN", DATE_FORMAT_OPTIONS)} ${d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/** Số ngày còn lại tính từ đó Hạn hoàn thành được coi là "sắp tới hạn". */
const DEADLINE_SOON_DAYS = 7;

/** Số tài liệu PO tải mỗi trang. BE chặn trên ở 100. */
const PO_DOCS_PAGE_SIZE = 20;

/** Số sản phẩm tải mỗi trang. BE chặn trên ở 100. */
const PO_PRODUCTS_PAGE_SIZE = 20;

type DeadlineTone = "overdue" | "soon" | "normal";

const deadlineValueClasses: Record<DeadlineTone, string> = {
  overdue: "text-error-600 dark:text-error-400",
  soon: "text-warning-600 dark:text-warning-400",
  normal: "text-gray-800 dark:text-gray-200",
};

const deadlineHintClasses: Record<DeadlineTone, string> = {
  overdue:
    "border-error-200 bg-error-50 text-error-700 dark:border-error-900/40 dark:bg-error-950/40 dark:text-error-300",
  soon: "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900/40 dark:bg-warning-950/40 dark:text-warning-300",
  normal: "",
};

/**
 * Trạng thái hạn hoàn thành. PO đã khóa hoặc đã hủy thì không cảnh báo nữa
 * vì đơn đã kết thúc, tô đỏ chỉ gây nhiễu.
 */
function getDeadlineInfo(
  deadline: string | null | undefined,
  status: PoStatus | undefined,
): { tone: DeadlineTone; hint: string | null } {
  if (!deadline || status === "closed" || status === "cancelled") {
    return { tone: "normal", hint: null };
  }

  const due = new Date(deadline);
  if (isNaN(due.getTime())) return { tone: "normal", hint: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return { tone: "overdue", hint: `Quá hạn ${Math.abs(diffDays)} ngày` };
  }
  if (diffDays === 0) return { tone: "soon", hint: "Đến hạn hôm nay" };
  if (diffDays <= DEADLINE_SOON_DAYS) {
    return { tone: "soon", hint: `Còn ${diffDays} ngày` };
  }
  return { tone: "normal", hint: null };
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
  const addProductMutation = useAddPoProduct();
  const removeProductMutation = useRemovePoProduct();
  const deletePoMutation = useDeletePurchaseOrder();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productPendingRemoval, setProductPendingRemoval] =
    useState<PurchaseOrderProductItem | null>(null);

  const handleDeletePo = async () => {
    if (!id) return;
    try {
      await deletePoMutation.mutateAsync(id);
      showToast("Đã xóa đơn hàng PO.");
      navigate("/po");
    } catch (err) {
      const apiErr = getApiError(err, "Xóa đơn hàng PO thất bại.");
      showToast(apiErr.message, "error");
      setIsDeleteDialogOpen(false);
    }
  };

  // Determine active tab from URL path
  const getTabFromPath = (): "general" | "lines" | "documents" => {
    const p = location.pathname.toLowerCase();
    if (p.includes("/products") || p.includes("/lines")) return "lines";
    if (p.includes("/documents") || p.includes("/files")) return "documents";
    return "general";
  };

  const activeTab = getTabFromPath();

  const handleTabClick = (tabKey: "general" | "lines" | "documents") => {
    if (tabKey === "general") navigate(`/po/${id}/detail`);
    else if (tabKey === "lines") navigate(`/po/${id}/products`);
    else if (tabKey === "documents") navigate(`/po/${id}/documents`);
  };

  // Chỉ tải danh sách sản phẩm khi người dùng thực sự mở tab Sản phẩm.
  const [productPage, setProductPage] = useState(1);
  const { data: productsPage, isLoading: isLoadingProducts } = usePoProducts(
    id,
    { page: productPage, limit: PO_PRODUCTS_PAGE_SIZE },
    { enabled: activeTab === "lines" },
  );
  const productsData = productsPage?.items;

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Chế độ xem Tab Sản phẩm: Chia khung 50/50 (true) hoặc Chế độ thường 100% (false) (Mặc định: false - Chế độ thường)
  const [isSplitMode, setIsSplitMode] = useState(false);

  // Tài liệu PO: tải riêng, có phân trang, và chỉ khi thực sự cần — tab Tài
  // liệu, chế độ chia khung (kéo thả tài liệu sang sản phẩm) hoặc modal thêm
  // sản phẩm (bước gán tài liệu từ kho PO).
  const [docPage, setDocPage] = useState(1);
  const needPoDocuments =
    activeTab === "documents" || isSplitMode || isAddProductOpen;
  const { data: poDocumentsPage, isFetching: isFetchingPoDocs } = usePoDocuments(
    id,
    { page: docPage, limit: PO_DOCS_PAGE_SIZE },
    { enabled: needPoDocuments },
  );
  const poDocuments = useMemo(
    () => poDocumentsPage?.items ?? [],
    [poDocumentsPage],
  );

  const [splitRatio, setSplitRatio] = useState<number>(50); // Mặc định 50/50

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
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [generalFieldErrors, setGeneralFieldErrors] = useState<{
    deadline?: string;
  }>({});

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
  const deadlineInfo = getDeadlineInfo(po?.deadline, po?.status);

  const startEdit = () => {
    if (!po) return;
    setCustomerPoCode(po.customerPoCode || "");
    setCustomerNameSnapshot(po.customerNameSnapshot || "");
    setReceivedDate(
      po.receivedDate ? new Date(po.receivedDate).toISOString().split("T")[0] : "",
    );
    setDeadline(
      po.deadline ? new Date(po.deadline).toISOString().split("T")[0] : "",
    );
    setNote(po.note || "");
    setGeneralFieldErrors({});
    setIsEditing(true);
  };

  const handleSaveGeneral = async () => {
    if (!po || !id) return;
    if (!deadline) {
      setGeneralFieldErrors({
        deadline: "Hạn hoàn thành (deadline) là bắt buộc, không được để trống.",
      });
      showToast("Vui lòng chọn hạn hoàn thành (deadline).", "error");
      return;
    }
    if (receivedDate && deadline <= receivedDate) {
      setGeneralFieldErrors({
        deadline: "Hạn hoàn thành (deadline) phải sau ngày nhận PO.",
      });
      showToast("Hạn hoàn thành (deadline) phải sau ngày nhận PO.", "error");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        input: {
          customerPoCode: customerPoCode.trim() || undefined,
          customerNameSnapshot: customerNameSnapshot.trim() || undefined,
          receivedDate: receivedDate || undefined,
          deadline,
          note: note.trim() || undefined,
        },
      });
      showToast("Đã cập nhật thông tin đơn hàng PO thành công.");
      setGeneralFieldErrors({});
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

  const handleRemoveProduct = async () => {
    if (!id || !productPendingRemoval) return;
    try {
      await removeProductMutation.mutateAsync({
        id,
        productId: productPendingRemoval.id,
      });
      showToast("Đã xóa sản phẩm khỏi đơn hàng PO.");
      setProductPendingRemoval(null);
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
    const docs = poDocuments;
    return [...docs].sort((a, b) => {
      const aAssigned = (docAssignmentsMap[a.documentId] || []).length > 0;
      const bAssigned = (docAssignmentsMap[b.documentId] || []).length > 0;
      if (aAssigned !== bAssigned) {
        return aAssigned ? 1 : -1; // Chưa gán lên trước
      }
      return 0;
    });
  }, [poDocuments, docAssignmentsMap]);

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
    productsData || [];

  return (
    <div className="space-y-3">
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
          { label: "Dashboard", to: "/dashboard" },
          { label: "Quản lý PO", to: "/po" },
          { label: po.poCode },
        ]}
        title="Chi tiết đơn hàng PO"
      />

      {/* Unified PO Header Card */}
      <div className="-mt-1 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2">
            <div className="flex items-center gap-2.5 shrink-0">
              <h1 className="font-mono text-base sm:text-lg font-bold tracking-tight leading-none text-gray-900 dark:text-white">
                {po.poCode}
              </h1>
              <PoStatusBadge status={po.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2 shrink-0">
            {po.status === "draft" && (
              <>
                <Button
                  size="xs"
                  onClick={() => handleStatusButtonClick("in_progress")}
                  disabled={updateStatusMutation.isPending}
                >
                  Bắt đầu xử lý PO →
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleStatusButtonClick("cancelled")}
                  disabled={updateStatusMutation.isPending}
                >
                  Hủy PO
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={updateStatusMutation.isPending}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/40"
                >
                  Xóa PO
                </Button>
              </>
            )}

            {(po.status === "in_progress" || po.status === "pending_rd") && (
              <>
                <Button
                  size="xs"
                  onClick={() => handleStatusButtonClick("closed")}
                  disabled={updateStatusMutation.isPending}
                >
                  Khóa PO
                </Button>
                <Button
                  variant="outline"
                  size="xs"
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
      <div className="-mt-1 flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-800 gap-2">
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
            Sản phẩm / Mẫu Fit ({productsPage?.total ?? po.productsCount ?? 0})
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("documents")}
            className={`border-b-2 py-2.5 transition-colors ${activeTab === "documents"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
          >
            Tài liệu PO ({po.documentsCount ?? 0})
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
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <svg
                    className="h-4 w-4"
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
                  <h3 className="text-theme-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                    Thông tin PO
                  </h3>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                    Chi tiết định danh và thông tin khách hàng của đơn hàng
                  </p>
                </div>
              </div>
              {!isEditing && !isLocked && (
                <Button variant="secondary" size="sm" onClick={startEdit}>
                  Chỉnh sửa
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                  <div>
                    <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Mã PO Khách hàng
                    </label>
                    <input
                      type="text"
                      value={customerPoCode}
                      onChange={(e) => setCustomerPoCode(e.target.value)}
                      placeholder="Nhập mã PO khách hàng..."
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
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
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Ngày nhận
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                      <input
                        type="date"
                        value={receivedDate}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker?.();
                          } catch {
                            /* ignore when unsupported */
                          }
                        }}
                        onChange={(e) => {
                          setReceivedDate(e.target.value);
                          if (generalFieldErrors.deadline) {
                            setGeneralFieldErrors((prev) => ({ ...prev, deadline: undefined }));
                          }
                        }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white cursor-pointer"
                      />
                      <CalenderIcon className="pointer-events-none absolute right-2.5 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                      Hạn hoàn thành <span className="text-error-500">*</span>
                    </label>
                    <div className="relative mt-1.5 flex items-center">
                      <input
                        type="date"
                        value={deadline}
                        onClick={(e) => {
                          try {
                            e.currentTarget.showPicker?.();
                          } catch {
                            /* ignore when unsupported */
                          }
                        }}
                        onChange={(e) => {
                          setDeadline(e.target.value);
                          if (generalFieldErrors.deadline) {
                            setGeneralFieldErrors((prev) => ({ ...prev, deadline: undefined }));
                          }
                        }}
                        className={`w-full rounded-lg border bg-white px-3 py-2 pr-9 text-theme-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-800 dark:text-white cursor-pointer ${
                          generalFieldErrors.deadline
                            ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                            : "border-gray-200 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-800"
                        }`}
                      />
                      <CalenderIcon className="pointer-events-none absolute right-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    {generalFieldErrors.deadline && (
                      <p className="mt-1 text-theme-xs font-medium text-error-600 dark:text-error-400">
                        {generalFieldErrors.deadline}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Ghi chú
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Thêm ghi chú đơn hàng..."
                    className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white p-3 text-theme-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGeneralFieldErrors({});
                      setIsEditing(false);
                    }}
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
              <div className="mt-4 space-y-5">
                <dl className="divide-y divide-gray-100 border-t border-b border-gray-100 dark:divide-gray-800/80 dark:border-gray-800/80">
                  <div className="flex items-center py-3 text-theme-sm">
                    <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                      Mã PO nội bộ
                    </dt>
                    <dd className="w-2/3 min-w-0 font-mono text-base font-bold text-blue-600 dark:text-blue-400">
                      {po.poCode}
                    </dd>
                  </div>

                  <div className="flex items-center py-3 text-theme-sm">
                    <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                      Khách hàng
                    </dt>
                    <dd className="w-2/3 min-w-0 break-words text-base font-bold text-gray-900 dark:text-white">
                      {po.customerNameSnapshot || "—"}
                    </dd>
                  </div>

                  <div className="flex items-center py-3 text-theme-sm">
                    <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                      Mã PO khách hàng
                    </dt>
                    <dd className="w-2/3 min-w-0 break-words font-mono text-base font-semibold text-gray-800 dark:text-gray-200">
                      {po.customerPoCode || "—"}
                    </dd>
                  </div>

                  <div className="flex items-center py-3 text-theme-sm">
                    <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                      Ngày nhận đơn
                    </dt>
                    <dd className="w-2/3 min-w-0 text-base font-semibold text-gray-800 dark:text-gray-200">
                      {formatDate(po.receivedDate)}
                    </dd>
                  </div>

                  <div className="flex items-center py-3 text-theme-sm">
                    <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                      Hạn hoàn thành
                    </dt>
                    <dd className="flex w-2/3 min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span
                        className={`text-base font-bold ${deadlineValueClasses[deadlineInfo.tone]}`}
                      >
                        {formatDate(po.deadline)}
                      </span>
                      {deadlineInfo.hint && (
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-theme-xs font-semibold ${deadlineHintClasses[deadlineInfo.tone]}`}
                        >
                          {deadlineInfo.hint}
                        </span>
                      )}
                    </dd>
                  </div>

                  {po.closedAt && (
                    <div className="flex items-center py-3 text-theme-sm">
                      <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                        Thời điểm khóa đơn
                      </dt>
                      <dd className="w-2/3 min-w-0 text-base font-semibold text-success-700 dark:text-success-300">
                        {formatDateTime(po.closedAt)}
                      </dd>
                    </div>
                  )}

                  {po.cancellationReason && (
                    <div className="flex items-start py-3 text-theme-sm">
                      <dt className="w-1/3 shrink-0 font-semibold text-gray-600 dark:text-gray-400">
                        Lý do hủy đơn
                      </dt>
                      <dd className="w-2/3 min-w-0 break-words font-medium text-error-700 dark:text-error-300">
                        {po.cancellationReason}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="space-y-3">
                  <h4 className="text-theme-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ghi chú đơn hàng
                  </h4>
                  <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
                    <p className="whitespace-pre-wrap text-theme-sm leading-relaxed text-gray-800 dark:text-gray-200">
                      {po.note || "Chưa có ghi chú cho đơn hàng này."}
                    </p>
                  </div>
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
              const allDocs = poDocuments;
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
                    poDocuments={poDocuments}
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
                      const resolvedImg = line.structureImageUrl ?? null;
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
                                    setProductPendingRemoval(line);
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
                                    setProductPendingRemoval(line);
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
                  Sản phẩm ({productsPage?.total ?? po.productsCount ?? 0})
                </h3>
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
              {isLoadingProducts ? (
                // Danh sách nạp khi mở tab, nên phải phân biệt "đang tải" với
                // "không có sản phẩm" — nếu không sẽ chớp màn hình rỗng kèm
                // lời mời thêm sản phẩm trước khi dữ liệu về.
                <div className="p-12 text-center">
                  <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                    Đang tải danh sách sản phẩm…
                  </p>
                </div>
              ) : lines.length === 0 ? (
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
                    const resolvedImg = line.structureImageUrl ?? null;
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
                                  setProductPendingRemoval(line);
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
                                  setProductPendingRemoval(line);
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
            {(productsPage?.totalPages ?? 0) > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                  Trang {productsPage?.page} / {productsPage?.totalPages} ·{" "}
                  {productsPage?.total} sản phẩm
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                    disabled={productPage <= 1 || isLoadingProducts}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setProductPage((p) => p + 1)}
                    disabled={
                      productPage >= (productsPage?.totalPages ?? 1) ||
                      isLoadingProducts
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* Tab 3: Tài liệu PO */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <PoDocumentsSection
            poId={id}
            documents={poDocuments}
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

          {(poDocumentsPage?.totalPages ?? 0) > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xs dark:border-gray-800 dark:bg-gray-900">
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Trang {poDocumentsPage?.page} / {poDocumentsPage?.totalPages} ·{" "}
                {poDocumentsPage?.total} tài liệu
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                  disabled={docPage <= 1 || isFetchingPoDocs}
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setDocPage((p) => p + 1)}
                  disabled={
                    docPage >= (poDocumentsPage?.totalPages ?? 1) ||
                    isFetchingPoDocs
                  }
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Lịch sử */}


      {/* Reason Modal Dialog */}
      <PoReasonModal
        isOpen={reasonModalState.isOpen}
        title={reasonModalState.title}
        actionText={reasonModalState.actionText}
        isPending={updateStatusMutation.isPending}
        onClose={() => setReasonModalState((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleReasonSubmit}
      />

      {/* Add Product Modal Dialog
          Chỉ mount khi mở: modal gọi useStyles({ limit: 100 }) và
          useImportFitPreview ngay trong thân component, mount sẵn đồng nghĩa
          với việc tải danh sách Mẫu Fit mỗi lần vào trang dù chưa ai bấm thêm
          sản phẩm. */}
      {isAddProductOpen && (
        <PoAddProductModal
          isOpen={isAddProductOpen}
          isPending={addProductMutation.isPending}
          poDocuments={poDocuments}
          onClose={() => setIsAddProductOpen(false)}
          onSubmit={handleAddProduct}
        />
      )}

      {/* Delete PO Confirm Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Xóa đơn hàng PO"
        description={
          <>
            Bạn có chắc muốn xóa vĩnh viễn đơn hàng <strong>{po.poCode}</strong> cùng toàn bộ
            sản phẩm, màu sắc, size và tài liệu bên trong? Hành động này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa PO"
        variant="danger"
        isSubmitting={deletePoMutation.isPending}
        onConfirm={handleDeletePo}
        onClose={() => setIsDeleteDialogOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(productPendingRemoval)}
        title="Xóa sản phẩm khỏi PO"
        description={
          <>
            Bạn có chắc muốn xóa{" "}
            <strong>{productPendingRemoval?.productCode}</strong> khỏi đơn hàng{" "}
            <strong>{po.poCode}</strong>? Toàn bộ màu sắc, size và tài liệu gắn
            với sản phẩm này sẽ mất theo. Hành động này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa sản phẩm"
        variant="danger"
        isSubmitting={removeProductMutation.isPending}
        onConfirm={handleRemoveProduct}
        onClose={() => setProductPendingRemoval(null)}
      />
    </div>
  );
}
