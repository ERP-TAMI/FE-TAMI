import { useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Plus, ExternalLink, FileSpreadsheet } from "lucide-react";
import { useBoms, useBom, useCreateBom } from "@/hooks/useBoms";
import { BomLinesEditor } from "@/components/features/bom/detail/BomLinesEditor";
import { useToast } from "@/hooks/useToast";
import { Toast } from "@/components/shared";

interface PoProductBomTabProps {
  productId: string;
  productCode: string;
  productName: string;
  poId: string;
  isProductLocked?: boolean;
  readOnly?: boolean;
}

export function PoProductBomTab({
  productId,
  productCode,
  productName,
  isProductLocked = false,
  readOnly = false,
}: PoProductBomTabProps) {
  const { toast, showToast, hideToast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
  const { data: bom, isLoading: isLoadingDetail } = useBom(bomId);

  // Mutations
  const createBomMutation = useCreateBom();

  // Create BOM handler
  const handleCreateBomForProduct = async () => {
    if (readOnly || isProductLocked) return;
    try {
      await createBomMutation.mutateAsync({
        type: "po",
        purchaseOrderProductId: productId,
      });
      showToast(`Đã tạo bảng NPL thành công cho sản phẩm ${productCode}`, "success");
      void refetchBomsList();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(
        axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi khi tạo NPL",
        "error",
      );
    }
  };

  const toastNode = toast ? (
    <Toast open message={toast.message} variant={toast.variant} onClose={hideToast} />
  ) : null;

  // Loading state
  if (isLoadingQuery || (bomId && isLoadingDetail)) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center p-8">
        <div className="border-brand-500 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
        <p className="mt-3 text-xs text-gray-500">Đang tải bảng định mức nguyên phụ liệu...</p>
      </div>
    );
  }

  // Case 1: Product does not have a BOM yet
  if (!bomId || !bom) {
    return (
      <>
        {toastNode}
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
            Chưa có Bảng định mức Nguyên phụ liệu (NPL)
          </h3>
          <p className="mt-1.5 max-w-md text-xs text-gray-500 dark:text-gray-400">
            Sản phẩm <strong>{productCode}</strong> ({productName}) chưa được thiết lập bảng NPL.
            {!readOnly &&
              " Khởi tạo NPL để nhập định mức vải, phụ liệu, chỉ may và tính toán giá thành."}
          </p>
          {!readOnly && (
            <button
              type="button"
              disabled={isProductLocked || createBomMutation.isPending}
              onClick={() => void handleCreateBomForProduct()}
              className="bg-brand-600 hover:bg-brand-700 mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>
                {createBomMutation.isPending
                  ? "Đang khởi tạo NPL..."
                  : "Tạo bảng NPL cho sản phẩm này"}
              </span>
            </button>
          )}
        </div>
      </>
    );
  }

  // Case 2: Product already has a BOM
  const currentStatus =
    bom.status === "discontinued" || Boolean(bom.discontinuedAt)
      ? "discontinued"
      : bom.status || bom.currentRevision?.status || "wait_nvkh";

  return (
    <div className="flex flex-col gap-4">
      {toastNode}
      {/* BOM Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                Mã NPL: {bom.bomCode}
              </span>
              <span className="bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 rounded-md px-2 py-0.5 text-[10px] font-bold">
                Phiên bản {bom.currentRevision?.revisionNo || 1}
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
        {!readOnly && (
          <Link
            to={`/bom/${bom.id}`}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200/80 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <span>Mở trang NPL đầy đủ &amp; Luân chuyển duyệt</span>
            <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
          </Link>
        )}
      </div>

      {/* Embedded Inline BOM Lines Table */}
      <BomLinesEditor
        bomId={bom.id}
        bomCode={bom.bomCode}
        exportTitle={`${bom.purchaseOrder?.poCode || bom.bomCode}- ${
          bom.purchaseOrder?.customerName || bom.style?.styleName || ""
        }`}
        rowVersion={bom.rowVersion}
        lines={bom.lines || []}
        readOnly={readOnly || isProductLocked}
        currentStatus={currentStatus}
        isHistorical={false}
        revisionId={bom.currentRevision?.id}
        costPerUnit={bom.costPerUnit}
        currentOrderQuantity={bom.currentOrderQuantity}
        currentOrderCost={bom.currentOrderCost}
        isDrawerOpen={isDrawerOpen}
        onDrawerOpenChange={setIsDrawerOpen}
        showToast={showToast}
      />
    </div>
  );
}
