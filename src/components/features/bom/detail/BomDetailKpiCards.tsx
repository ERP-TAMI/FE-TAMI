import {
  Calendar,
  Shirt,
} from "lucide-react";
import type { BomDetail } from "@/types/bom";
import { canViewBomCost, formatVND, formatDate } from "@/lib/bomAccess";
import { useAuthStore } from "@/store/authStore";

interface BomDetailKpiCardsProps {
  bom: BomDetail;
}

export function BomDetailKpiCards({ bom }: BomDetailKpiCardsProps) {
  const user = useAuthStore((state) => state.user);
  const canSeeCost = canViewBomCost(user);

  const linesCount = bom.lines?.length ?? 0;

  // Product or Style display name & code
  const productCode =
    bom.type === "fit"
      ? bom.style?.styleCode || "—"
      : bom.product?.productCode ||
        bom.purchaseOrderProduct?.productCode ||
        bom.productCodeSnapshot ||
        bom.style?.styleCode ||
        bom.bomCode;

  const productName =
    bom.style?.styleName ||
    bom.product?.productName ||
    bom.purchaseOrderProduct?.productName ||
    bom.productNameSnapshot;

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
      {/* 1. Sản phẩm */}
      <div className="flex flex-1 items-center gap-3.5 pr-6 pb-3 md:pb-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100/80 border border-gray-200/60 dark:bg-gray-800 dark:border-gray-700 text-gray-500 dark:text-gray-400">
          <Shirt className="h-6 w-6 stroke-[1.5]" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs font-medium text-gray-400 dark:text-gray-500">
              {bom.type === "fit" ? "Mẫu Fit / Style" : "Sản phẩm"}
            </span>
            {bom.purchaseOrder?.poCode && (
              <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                {bom.purchaseOrder.poCode}
              </span>
            )}
            {bom.colorNameSnapshot && (
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Màu: {bom.colorNameSnapshot}
              </span>
            )}
          </div>
          <div className="truncate text-base font-bold text-gray-900 dark:text-white">
            {productCode}
          </div>
          {productName && (
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {productName}
            </div>
          )}
          {bom.purchaseOrder?.poCode && (
            <div className="truncate text-[11px] text-gray-400">
              Mã: {bom.purchaseOrder.poCode}
            </div>
          )}
        </div>
      </div>

      {/* 2. Đơn hàng */}
      <div className="flex flex-col justify-center px-6 py-3 md:py-0 min-w-36 shrink-0">
        <span className="text-theme-xs font-medium text-gray-400 dark:text-gray-500">
          Đơn hàng
        </span>
        <div className="text-base font-bold text-gray-900 dark:text-white">
          {bom.currentOrderQuantity != null
            ? `${bom.currentOrderQuantity.toLocaleString("vi-VN")} SP`
            : "—"}
        </div>
      </div>

      {/* 3. NPL */}
      <div className="flex flex-col justify-center px-6 py-3 md:py-0 w-28 shrink-0">
        <span className="text-theme-xs font-medium text-gray-400 dark:text-gray-500">
          NPL
        </span>
        <div className="text-lg font-bold text-gray-900 dark:text-white">
          {linesCount}
        </div>
      </div>

      {/* 4. Chi phí (Visible when user has permission) */}
      {canSeeCost && bom.type !== "fit" && (
        <div className="flex flex-col justify-center px-6 py-3 md:py-0 min-w-36 shrink-0">
          <span className="text-theme-xs font-medium text-gray-400 dark:text-gray-500">
            Chi phí
          </span>
          <div className="text-base font-bold text-gray-900 dark:text-white font-mono">
            {bom.costPerUnit != null ? (
              <>
                <span>{formatVND(bom.costPerUnit)}</span>
              </>
            ) : (
              "—"
            )}
          </div>
          {bom.currentOrderCost != null && (
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              Tổng: <span>{formatVND(bom.currentOrderCost)}</span>
            </div>
          )}
        </div>
      )}

      {/* 5. Hạn hoàn thành */}
      <div className="flex flex-col justify-center pl-6 pt-3 md:pt-0 min-w-36 shrink-0">
        <span className="text-theme-xs font-medium text-gray-400 dark:text-gray-500">
          Hạn hoàn thành
        </span>
        <div className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{bom.deadline ? formatDate(bom.deadline) : "—"}</span>
        </div>
      </div>

      {/* Accessible cost representation when masked */}
      {!canSeeCost && (
        <div className="sr-only">
          <span>Bảo mật chi phí</span>
        </div>
      )}
    </div>
  );
}
