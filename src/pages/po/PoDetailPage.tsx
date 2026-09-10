import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Toast, Button } from "@/components/shared";
import { PoStatusBadge } from "@/components/features/po/PoStatusBadge";
import { PoReasonModal } from "@/components/features/po/PoReasonModal";
import { PoAddProductModal } from "@/components/features/po/PoAddProductModal";
import { PoDocumentsSection } from "@/components/features/po/PoDocumentsSection";
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
import { TrashBinIcon, CalenderIcon } from "@/icons";
import type {
  CreatePoProductInput,
  PoStatus,
  PurchaseOrderProductItem,
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

  const [activeTab, setActiveTab] = useState<"general" | "lines" | "documents" | "history">("general");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

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

      {/* Unified PO Header Card: PO Code & Actions (+ Info on non-general tabs) */}
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Big PO Code + Status Badge (+ Metadata when on other tabs) */}
          <div className="flex flex-wrap items-center gap-x-5 sm:gap-x-6 gap-y-2">
            <div className="flex items-center gap-3 shrink-0">
              <h1 className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight leading-none text-gray-900 dark:text-white">
                {po.poCode}
              </h1>
              <PoStatusBadge status={po.status} />
            </div>
          </div>

          {/* Right: Workflow Action Buttons */}
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

        {/* Cancelled PO reason banner */}
        {po.status === "cancelled" && po.cancellationReason && (
          <div className="mt-3 rounded-xl border border-error-200 bg-error-50/70 p-2.5 text-theme-xs font-medium text-error-800 dark:border-error-900/40 dark:bg-error-950/40 dark:text-error-300">
            Đơn hàng đã bị hủy. Lý do: {po.cancellationReason}
          </div>
        )}

        {/* Locked PO warning banner */}
        {isLocked && (
          <div className="mt-3 rounded-xl border border-warning-200 bg-warning-50/70 p-2.5 text-theme-xs font-medium text-warning-800 dark:border-warning-900/40 dark:bg-warning-950/40 dark:text-warning-300">
            Đơn hàng PO đã <strong>khóa</strong> vào ngày {formatDate(po.closedAt)}. Mọi thông tin đã được chuyển sang chế độ chỉ đọc.
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex gap-6 text-theme-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`border-b-2 py-2.5 transition-colors ${
              activeTab === "general"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Thông tin chung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("lines")}
            className={`border-b-2 py-2.5 transition-colors ${
              activeTab === "lines"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Sản phẩm / Mẫu Fit ({lines.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`border-b-2 py-2.5 transition-colors ${
              activeTab === "documents"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Tài liệu PO ({po.documents?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`border-b-2 py-2.5 transition-colors ${
              activeTab === "history"
                ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            Lịch sử ({po.statusHistory?.length || 0})
          </button>
        </nav>
      </div>

      {/* Tab 1: Thông tin chung */}
      {activeTab === "general" && (
        <div className="space-y-5">
          {/* Card: THÔNG TIN PO */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                    <div className="flex items-center justify-between">
                      <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        Ngày nhận
                      </label>
                      <button
                        type="button"
                        onClick={() => setReceivedDate(new Date().toISOString().split("T")[0])}
                        className="text-theme-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        Hôm nay
                      </button>
                    </div>
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
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-10 text-theme-base text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white cursor-pointer"
                      />
                      <CalenderIcon className="pointer-events-none absolute right-3 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-theme-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                        Hạn hoàn thành (Deadline) <span className="text-error-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setDeadline(new Date().toISOString().split("T")[0]);
                          if (generalFieldErrors.deadline) {
                            setGeneralFieldErrors((prev) => ({ ...prev, deadline: undefined }));
                          }
                        }}
                        className="text-theme-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        Hôm nay
                      </button>
                    </div>
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
                        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-10 text-theme-base text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-800 dark:text-white cursor-pointer ${
                          generalFieldErrors.deadline
                            ? "border-error-400 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500"
                            : "border-gray-200 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-800"
                        }`}
                      />
                      <CalenderIcon className="pointer-events-none absolute right-3 h-5 w-5 text-gray-400" />
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
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú cho đơn hàng..."
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-theme-base text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
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
                    onClick={() => void handleSaveGeneral()}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {/* Tile 1: Mã PO hệ thống */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 transition-all hover:bg-gray-50 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Mã PO hệ thống
                  </span>
                  <span className="mt-2 block font-mono text-xl sm:text-2xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
                    {po.poCode}
                  </span>
                </div>

                {/* Tile 2: Khách hàng */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 transition-all hover:bg-gray-50 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Khách hàng
                  </span>
                  <span className="mt-2 block text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate" title={po.customerNameSnapshot}>
                    {po.customerNameSnapshot}
                  </span>
                </div>

                {/* Tile 3: Mã PO khách hàng */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 transition-all hover:bg-gray-50 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Mã PO khách hàng
                  </span>
                  <span className="mt-2 block font-mono text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {po.customerPoCode || "—"}
                  </span>
                </div>

                {/* Tile 4: Ngày nhận */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 transition-all hover:bg-gray-50 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Ngày nhận đơn
                  </span>
                  <span className="mt-2 block text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {formatDate(po.receivedDate)}
                  </span>
                </div>

                {/* Tile 5: Hạn hoàn thành */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4.5 transition-all hover:bg-gray-50 hover:border-gray-200 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700">
                  <span className="block text-theme-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Hạn hoàn thành
                  </span>
                  <span className="mt-2 block text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {po.deadline ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        {formatDate(po.deadline)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>

                {/* Locked info tile if locked */}
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

                {/* Cancelled info tile if cancelled */}
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

                {/* Tile 5: Ghi chú */}
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

      {/* Tab 2: Sản phẩm / Mẫu Fit (PO Lines) */}
      {activeTab === "lines" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
            <div>
              <h3 className="text-theme-base font-bold text-gray-900 dark:text-white">
                Danh sách sản phẩm thuộc đơn hàng PO
              </h3>
              <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
                Quản lý các dòng sản phẩm, Mẫu Fit và tiến độ sản xuất theo PO
              </p>
            </div>
            {!isLocked && (
              <Button size="sm" onClick={() => setIsAddProductOpen(true)}>
                + Thêm sản phẩm
              </Button>
            )}
          </div>

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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-theme-sm text-gray-700 dark:text-gray-300">
                <thead className="border-b border-gray-200 bg-gray-50/80 text-theme-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3.5">Mã sản phẩm / Style</th>
                    <th className="px-5 py-3.5">Tên sản phẩm</th>
                    <th className="px-5 py-3.5">Danh mục</th>
                    <th className="px-5 py-3.5">Ghi chú / Phụ liệu</th>
                    <th className="px-5 py-3.5">Hạn giao</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {lines.map((line) => (
                    <tr
                      key={line.id}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-5 py-4 font-mono font-semibold text-brand-600 dark:text-brand-400">
                        {line.productCode || line.styleCode}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                        {line.productName}
                      </td>
                      <td className="px-5 py-4 text-theme-xs text-gray-500 dark:text-gray-400">
                        {line.category || "—"}
                      </td>
                      <td className="px-5 py-4 text-theme-xs text-gray-700 dark:text-gray-300">
                        {line.materialNote || line.colorName || "—"}
                      </td>
                      <td className="px-5 py-4 text-theme-xs text-gray-500 dark:text-gray-400">
                        {formatDate(line.deadline)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-theme-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {line.status || "Hoạt động"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/styles`)}
                          >
                            Xem Style →
                          </Button>
                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() => void handleRemoveProduct(line.id)}
                              disabled={removeProductMutation.isPending}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-950/40 dark:hover:text-error-400 transition-colors"
                              title="Xóa khỏi PO"
                            >
                              <TrashBinIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-theme-base font-bold text-gray-900 dark:text-white">
            Nhật ký chuyển trạng thái & lịch sử
          </h3>

          <div className="mt-5 space-y-4">
            {(po.statusHistory || []).length === 0 ? (
              <p className="text-theme-sm text-gray-400 italic">Chưa có thông tin lịch sử.</p>
            ) : (
              (po.statusHistory || []).map((item) => (
                <div
                  key={item.id}
                  className="relative pl-5 border-l-2 border-brand-500 space-y-1 py-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-theme-sm text-gray-900 dark:text-white">
                      {item.action}
                    </span>
                    <span className="text-theme-xs text-gray-400 font-mono">
                      {formatDateTime(item.changedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-theme-xs">
                    {item.oldStatus && (
                      <>
                        <PoStatusBadge status={item.oldStatus} showDot={false} />
                        <span className="text-gray-400">→</span>
                      </>
                    )}
                    <PoStatusBadge status={item.newStatus} showDot={false} />
                  </div>

                  {item.reason && (
                    <p className="text-theme-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl mt-1">
                      <strong>Lý do:</strong> {item.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
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
        onClose={() => setIsAddProductOpen(false)}
        onSubmit={handleAddProduct}
      />
    </div>
  );
}
