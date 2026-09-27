import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  Plus,
  ExternalLink,
  FileSpreadsheet,
} from "lucide-react";
import {
  useBoms,
  useBom,
  useCreateBom,
  useAddBomLine,
  useUpdateBomLine,
  useDeleteBomLine,
  useReorderBomLines,
} from "@/hooks/useBoms";
import { BomLinesTable } from "@/components/features/bom/detail/BomLinesTable";
import { BomAddMaterialDrawer } from "@/components/features/bom/detail/BomAddMaterialDrawer";
import { BomLineDeleteDialog } from "@/components/features/bom/detail/BomLineDeleteDialog";
import { useToast } from "@/hooks/useToast";
import type { BomLineItem, CreateBomLinePayload, UpdateBomLinePayload } from "@/types/bom";

interface PoProductBomTabProps {
  productId: string;
  productCode: string;
  productName: string;
  poId: string;
  isProductLocked?: boolean;
}

export function PoProductBomTab({
  productId,
  productCode,
  productName,
  isProductLocked = false,
}: PoProductBomTabProps) {
  const { showToast } = useToast();

  // Query BOMs for this product
  const {
    data: bomsData,
    isLoading: isLoadingQuery,
    refetch: refetchBomsList,
  } = useBoms({
    product: productId,
    limit: 1,
  });

  const existingBomSummary = bomsData?.data?.[0];
  const bomId = existingBomSummary?.id;

  // Query full detail if BOM exists
  const {
    data: bom,
    isLoading: isLoadingDetail,
  } = useBom(bomId);

  // Mutations
  const createBomMutation = useCreateBom();
  const addLineMutation = useAddBomLine(bomId || "");
  const updateLineMutation = useUpdateBomLine(bomId || "");
  const deleteLineMutation = useDeleteBomLine(bomId || "");
  const reorderLinesMutation = useReorderBomLines(bomId || "");

  // Modal states for Line Modal / Delete Dialog
  const [isLineModalOpen, setIsLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BomLineItem | null>(null);
  const [deletingLine, setDeletingLine] = useState<BomLineItem | null>(null);

  // Create BOM handler
  const handleCreateBomForProduct = async () => {
    try {
      await createBomMutation.mutateAsync({
        type: "po",
        purchaseOrderProductId: productId,
      });
      showToast(`Đã tạo bảng BOM thành công cho sản phẩm ${productCode}`, "success");
      void refetchBomsList();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi khi tạo BOM", "error");
    }
  };

  // Line CRUD handlers
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

  const handleCreateBatch = async (payloads: CreateBomLinePayload[]) => {
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

  const handleConfirmDelete = async () => {
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

  const handleReorder = async (newLineIds: string[]) => {
    try {
      await reorderLinesMutation.mutateAsync({ lineIds: newLineIds });
      showToast("Đã sắp xếp lại thứ tự vật tư", "success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi khi sắp xếp", "error");
    }
  };

  // Loading state
  if (isLoadingQuery || (bomId && isLoadingDetail)) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-3 text-xs text-gray-500">Đang tải bảng định mức nguyên phụ liệu...</p>
      </div>
    );
  }

  // Case 1: Product does not have a BOM yet
  if (!bomId || !bom) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
          <Layers className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
          Chưa có Bảng định mức Nguyên phụ liệu (BOM)
        </h3>
        <p className="mt-1.5 max-w-md text-xs text-gray-500 dark:text-gray-400">
          Sản phẩm <strong>{productCode}</strong> ({productName}) chưa được thiết lập bảng BOM.
          Khởi tạo ngay để nhập liệu định mức vải, phụ liệu, chỉ may và tính toán giá thành.
        </p>
        <button
          type="button"
          disabled={isProductLocked || createBomMutation.isPending}
          onClick={() => void handleCreateBomForProduct()}
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>
            {createBomMutation.isPending
              ? "Đang khởi tạo BOM..."
              : "Tạo bảng BOM cho sản phẩm này"}
          </span>
        </button>
      </div>
    );
  }

  // Case 2: Product already has a BOM
  const currentStatus =
    bom.status === "discontinued" || Boolean(bom.discontinuedAt)
      ? "discontinued"
      : bom.status || bom.currentRevision?.status || "wait_nvkh";

  return (
    <div className="flex flex-col gap-4">
      {/* BOM Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                Mã BOM: {bom.bomCode}
              </span>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                Rev {bom.currentRevision?.revisionNo || 1}
              </span>
              {currentStatus === "discontinued" && (
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                  Ngừng dùng
                </span>
              )}
              {currentStatus === "closed" && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  Đã chốt
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Tổng số dòng: {bom.lines?.length || 0} vật tư • Trạng thái: {currentStatus}
            </p>
          </div>
        </div>

        {/* Action: Open Master BOM Detail Page */}
        <Link
          to={`/bom/${bom.id}`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <span>Mở trang BOM đầy đủ &amp; Luân chuyển duyệt</span>
          <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
        </Link>
      </div>

      {/* Embedded Inline BOM Lines Table */}
      <BomLinesTable
        lines={bom.lines || []}
        currentStatus={currentStatus}
        isHistorical={false}
        costPerUnit={bom.costPerUnit}
        currentOrderQuantity={bom.currentOrderQuantity}
        currentOrderCost={bom.currentOrderCost}
        onAddLine={handleOpenAddLine}
        onEditLine={handleOpenEditLine}
        onDeleteLine={(line) => setDeletingLine(line)}
        onReorderLines={handleReorder}
        isReordering={reorderLinesMutation.isPending}
        onAddLineInline={handleCreateLine}
        onUpdateLineInline={(lineId, payload) =>
          updateLineMutation.mutateAsync({ lineId, payload }).then(() => {
            showToast("Đã cập nhật dòng vật tư", "success");
          })
        }
      />

      {/* Modal Add / Edit Line (Alternative Modal Option) */}
      <BomAddMaterialDrawer
        isOpen={isLineModalOpen}
        onClose={() => setIsLineModalOpen(false)}
        initialLine={editingLine}
        existingLines={bom.lines || []}
        onSubmitCreate={handleCreateLine}
        onSubmitCreateBatch={handleCreateBatch}
        onSubmitUpdate={handleUpdateLine}
        currentStatus={currentStatus}
        isHistorical={false}
      />

      {/* Modal Confirm Delete Line */}
      <BomLineDeleteDialog
        isOpen={Boolean(deletingLine)}
        line={deletingLine}
        onClose={() => setDeletingLine(null)}
        onConfirm={handleConfirmDelete}
        isSubmitting={deleteLineMutation.isPending}
      />
    </div>
  );
}
