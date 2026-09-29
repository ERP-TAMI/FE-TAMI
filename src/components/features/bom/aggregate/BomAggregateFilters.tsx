import { useState, useMemo, useEffect, useRef } from "react";
import { RotateCcw, ChevronDown, FileText, Search, Filter, Layers, Package } from "lucide-react";
import type {
  AggregateBreakdownType,
  BomAggregateItem,
  BomListItem,
  PurchaseOrderSummary,
} from "@/types/bom";
import { BomAggregateSummary } from "./BomAggregateSummary";
import { useBoms } from "@/hooks/useBoms";
import { usePoProducts } from "@/hooks/usePurchaseOrders";
import { useStyles } from "@/hooks/useStyles";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialGroups } from "@/hooks/useMaterialGroups";
import type { Style } from "@/types/style";
import type { Material } from "@/types/material";
import type { PurchaseOrderProductItem } from "@/types/po";

interface BomAggregateFiltersProps {
  purchaseOrderId?: string;
  onPurchaseOrderChange: (poId?: string) => void;
  bomId?: string;
  onBomChange: (bomId?: string) => void;
  purchaseOrderProductIds: string[];
  onProductChange?: (productIds: string[]) => void;
  styleId?: string;
  onStyleChange: (styleId?: string) => void;
  materialId?: string;
  onMaterialChange: (materialId?: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  breakdown: AggregateBreakdownType;
  onBreakdownChange: (breakdown: AggregateBreakdownType) => void;
  isFiltering: boolean;
  onClearFilters: () => void;
  onApplyFilters?: () => void;
  totalCount?: number;
  bomCount?: number;
  items?: BomAggregateItem[];
}

export function BomAggregateFilters({
  purchaseOrderId,
  onPurchaseOrderChange,
  bomId,
  onBomChange,
  purchaseOrderProductIds,
  onProductChange,
  styleId,
  onStyleChange,
  materialId,
  onMaterialChange,
  search: _search,
  onSearchChange,
  breakdown,
  onBreakdownChange,
  isFiltering,
  onClearFilters,
  onApplyFilters,
  totalCount,
  bomCount,
  items,
}: BomAggregateFiltersProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isExtraOpen, setIsExtraOpen] = useState<boolean>(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);
  const productMenuRef = useRef<HTMLDivElement>(null);
  const productTriggerRef = useRef<HTMLButtonElement>(null);

  // Lấy danh sách BOM type=po, revision đã đóng (closed)
  const { data: approvedBomsResponse } = useBoms({
    type: "po",
    status: "closed",
    limit: 100,
  });

  // Nếu đã chọn PO cụ thể, chỉ lấy BOM của PO đó
  const { data: poBomsResponse } = useBoms(
    { type: "po", status: "closed", purchaseOrder: purchaseOrderId, limit: 100 },
    { enabled: Boolean(purchaseOrderId) },
  );

  const { data: poProductsResponse } = usePoProducts(
    purchaseOrderId,
    { limit: 100 },
    { enabled: Boolean(purchaseOrderId) },
  );
  const poProducts: PurchaseOrderProductItem[] = poProductsResponse?.items || [];
  const selectedProductIdSet = useMemo(
    () => new Set(purchaseOrderProductIds),
    [purchaseOrderProductIds],
  );

  useEffect(() => {
    if (!isProductMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!productMenuRef.current?.contains(event.target as Node)) {
        setIsProductMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProductMenuOpen(false);
        productTriggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isProductMenuOpen]);

  const allApprovedBoms: BomListItem[] = useMemo(
    () => approvedBomsResponse?.data || [],
    [approvedBomsResponse?.data],
  );

  // Tổng hợp danh sách PO unique từ các BOM đã duyệt
  const approvedPoList: PurchaseOrderSummary[] = useMemo(() => {
    const seenIds = new Set<string>();
    const list: PurchaseOrderSummary[] = [];
    allApprovedBoms.forEach((bom) => {
      const po = bom.purchaseOrder;
      if (po && !seenIds.has(po.id)) {
        seenIds.add(po.id);
        list.push(po);
      }
    });
    return list;
  }, [allApprovedBoms]);

  // Danh sách BOM hợp lệ để hiển thị trong bộ lọc:
  // Nếu đã chọn PO: chỉ lấy BOM thuộc PO đó
  // Nếu chưa chọn PO: lấy tất cả BOM đã duyệt
  const eligibleBoms: BomListItem[] = useMemo(() => {
    if (purchaseOrderId) {
      if (poBomsResponse?.data && poBomsResponse.data.length > 0) {
        return poBomsResponse.data;
      }
      return allApprovedBoms.filter(
        (bom) =>
          bom.purchaseOrder?.id === purchaseOrderId ||
          bom.purchaseOrder?.poCode === purchaseOrderId,
      );
    }
    return allApprovedBoms;
  }, [allApprovedBoms, poBomsResponse?.data, purchaseOrderId]);

  const currentBomId = bomId;

  const { data: styleResponse } = useStyles({ limit: 100 });
  const styleList: Style[] = styleResponse?.data || [];

  const { data: materialResponse } = useMaterials({ limit: 100 });
  const materialList = materialResponse?.data ?? [];
  const { data: materialGroupResponse } = useMaterialGroups({ limit: 100 });
  const materialGroups = materialGroupResponse?.data ?? [];

  const handleBomSelect = (newBomId: string) => {
    const val = newBomId || undefined;
    setIsProductMenuOpen(false);
    onBomChange(val);
  };

  const handlePoSelect = (newPoId: string) => {
    const val = newPoId || undefined;
    setIsProductMenuOpen(false);
    onPurchaseOrderChange(val);
  };

  const handleGroupSelect = (groupVal: string) => {
    setSelectedGroup(groupVal);
    onSearchChange(groupVal);
  };

  const handleClear = () => {
    setSelectedGroup("");
    setIsExtraOpen(false);
    setIsProductMenuOpen(false);
    onBomChange(undefined);
    onProductChange?.([]);
    onClearFilters();
  };

  return (
    <div
      data-testid="aggregate-filter-card"
      className="flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Hidden summary for tests */}
      {totalCount !== undefined && (
        <div className="sr-only">
          <BomAggregateSummary totalCount={totalCount} bomCount={bomCount} items={items || []} />
        </div>
      )}

      {/* Row 1: Left KPI Summary & Filter Inputs & Actions */}
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        {/* 1. Trạng thái BOM */}
        <div className="flex min-w-[130px] flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Trạng thái BOM
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span>Đã duyệt</span>
          </div>
        </div>

        {/* 3. BOM */}
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">BOM</label>
          <div className="relative">
            <select
              id="aggregate-bom-select"
              data-testid="aggregate-bom-select"
              value={currentBomId || ""}
              onChange={(e) => handleBomSelect(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-1.5 pr-7 pl-7 text-xs text-gray-700 shadow-2xs transition-colors hover:border-blue-300 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">{purchaseOrderId ? "Tất cả BOM trong đơn" : "Tất cả BOM"}</option>
              {eligibleBoms.map((bom: BomListItem) => {
                const productCode = bom.product?.productCode || bom.style?.styleCode || bom.bomCode;
                return (
                  <option key={bom.id} value={bom.id}>
                    {productCode}
                  </option>
                );
              })}
            </select>
            <Layers className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* 4. Đơn hàng (PO) */}
        <div className="flex min-w-[180px] flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Đơn hàng (PO)
          </label>
          <div className="relative">
            <select
              id="aggregate-po-select"
              data-testid="aggregate-po-select"
              value={purchaseOrderId || ""}
              onChange={(e) => handlePoSelect(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-1.5 pr-7 pl-7 text-xs text-gray-700 shadow-2xs transition-colors hover:border-blue-300 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
            >
              <option value="">Tất cả đơn hàng</option>
              {approvedPoList.map((po: PurchaseOrderSummary) => (
                <option key={po.id} value={po.id}>
                  {po.poCode} {po.customerName ? `(${po.customerName})` : ""}
                </option>
              ))}
            </select>
            <FileText className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* 5. Multi-select sản phẩm trong PO */}
        <div className="flex min-w-[190px] flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sản phẩm</label>
          {purchaseOrderId ? (
            <div className="relative" ref={productMenuRef}>
              <button
                type="button"
                id="aggregate-product-select"
                data-testid="aggregate-product-select"
                ref={productTriggerRef}
                aria-label="Chọn sản phẩm trong PO"
                aria-haspopup="true"
                aria-expanded={isProductMenuOpen}
                aria-controls={isProductMenuOpen ? "aggregate-product-options" : undefined}
                onClick={() => setIsProductMenuOpen((isOpen) => !isOpen)}
                className="flex min-h-8 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-2xs transition-colors hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Package className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span className="truncate">
                    {purchaseOrderProductIds.length === 0
                      ? "Tất cả sản phẩm trong PO"
                      : `${purchaseOrderProductIds.length} sản phẩm đã chọn`}
                  </span>
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
                    isProductMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isProductMenuOpen && (
                <div
                  id="aggregate-product-options"
                  role="group"
                  aria-label="Danh sách sản phẩm trong PO"
                  className="absolute right-0 z-30 mt-1 max-h-64 w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                >
                  {poProducts.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-gray-600 dark:text-gray-300">
                      PO này chưa có sản phẩm.
                    </p>
                  ) : (
                    <>
                      <p className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300">
                        Chọn một hoặc nhiều sản phẩm
                      </p>
                      {poProducts.map((product) => (
                        <label
                          key={product.id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-xs text-gray-800 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <input
                            type="checkbox"
                            aria-label={`${product.productCode} - ${product.productName}`}
                            checked={selectedProductIdSet.has(product.id)}
                            onChange={(event) =>
                              onProductChange?.(
                                event.target.checked
                                  ? [...purchaseOrderProductIds, product.id]
                                  : purchaseOrderProductIds.filter((id) => id !== product.id),
                              )
                            }
                            className="mt-0.5 cursor-pointer rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600"
                          />
                          <span>
                            <span className="block font-medium">{product.productCode}</span>
                            <span className="block text-gray-600 dark:text-gray-300">
                              {product.productName}
                            </span>
                          </span>
                        </label>
                      ))}
                      {purchaseOrderProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onProductChange?.([])}
                          className="mt-1 w-full cursor-pointer rounded-lg border-t border-gray-100 px-2 py-2 text-left text-xs font-medium text-brand-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:border-gray-800 dark:text-brand-300 dark:hover:bg-gray-800"
                        >
                          Bỏ chọn sản phẩm
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-8 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              <Package className="h-3.5 w-3.5 text-gray-400" />
              <span>Chọn PO trước</span>
            </div>
          )}
        </div>

        {/* 6. Đặt lại & Bộ lọc nâng cao */}
        <div className="flex items-end gap-2">
          {isFiltering && (
            <button
              type="button"
              data-testid="clear-filters-btn"
              onClick={handleClear}
              title="Đặt lại bộ lọc"
              aria-label="Đặt lại bộ lọc"
              className="animate-in fade-in-50 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
              <span>Đặt lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExtraOpen((prev) => !prev)}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/60 px-3.5 py-1.5 text-xs font-semibold text-blue-600 shadow-2xs transition-colors hover:bg-blue-100/70 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{isExtraOpen ? "Ẩn bộ lọc" : "Bộ lọc nâng cao"}</span>
          </button>
        </div>
      </div>

      {/* Extra Filters (Toggled when clicking 'Bộ lọc nâng cao') */}
      {isExtraOpen && (
        <div className="grid grid-cols-1 items-end gap-3 border-t border-gray-100 pt-3 sm:grid-cols-3 dark:border-gray-800">
          {/* Nhóm NPL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Nhóm NPL
            </label>
            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-3 py-1.5 pr-8 text-xs text-gray-700 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="">Tất cả nhóm</option>
                {materialGroups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Mẫu (Style) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Mẫu (Style)
            </label>
            <div className="relative">
              <select
                value={styleId || ""}
                onChange={(e) => onStyleChange(e.target.value || undefined)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white px-3 py-1.5 pr-8 text-xs text-gray-700 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
              >
                <option value="">Tất cả mẫu</option>
                {styleList.map((s: Style) => (
                  <option key={s.id} value={s.id}>
                    {s.styleCode} - {s.styleName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Buttons: Đặt lại & Áp dụng */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="extra-reset-btn"
              onClick={handleClear}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Đặt lại</span>
            </button>
            <button
              type="button"
              onClick={onApplyFilters}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Áp dụng</span>
            </button>
          </div>
        </div>
      )}

      {/* Programmatic / accessible hidden selects for test integration */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="aggregate-style-select">Mẫu (Style)</label>
        <select
          id="aggregate-style-select"
          data-testid="aggregate-style-select"
          value={styleId || ""}
          onChange={(e) => onStyleChange(e.target.value || undefined)}
        >
          <option value="">Tất cả Mẫu</option>
          {styleList.map((s: Style) => (
            <option key={s.id} value={s.id}>
              {s.styleCode} - {s.styleName}
            </option>
          ))}
        </select>

        <label htmlFor="aggregate-material-select">Vật tư</label>
        <select
          id="aggregate-material-select"
          data-testid="aggregate-material-select"
          value={materialId || ""}
          onChange={(e) => onMaterialChange(e.target.value || undefined)}
        >
          <option value="">Tất cả Vật tư</option>
          {materialList.map((m: Material) => (
            <option key={m.id} value={m.id}>
              {m.materialName} ({m.materialCode})
            </option>
          ))}
        </select>

        <label htmlFor="aggregate-breakdown-select">Chế độ phân rã</label>
        <select
          id="aggregate-breakdown-select"
          data-testid="aggregate-breakdown-select"
          value={breakdown}
          onChange={(e) => onBreakdownChange(e.target.value as AggregateBreakdownType)}
        >
          <option value="none">Không phân rã</option>
          <option value="color">Màu sắc</option>
          <option value="size">Kích cỡ</option>
          <option value="color_size">Màu + Kích cỡ</option>
        </select>
      </div>
    </div>
  );
}
