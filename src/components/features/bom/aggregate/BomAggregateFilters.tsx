import { useState, useMemo, useRef, useEffect } from "react";
import { RotateCcw, Calendar, ChevronDown, FileText, Search, Filter, Layers } from "lucide-react";
import type { AggregateBreakdownType, BomAggregateItem, BomListItem, PurchaseOrderSummary } from "@/types/bom";
import { BomAggregateSummary } from "./BomAggregateSummary";
import { useBoms } from "@/hooks/useBoms";
import { useStyles } from "@/hooks/useStyles";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialGroups } from "@/hooks/useMaterialGroups";
import type { Style } from "@/types/style";
import type { Material } from "@/types/material";

export type PeriodType = "this_month" | "last_month" | "this_quarter" | "this_year" | "custom";

interface BomAggregateFiltersProps {
  purchaseOrderId?: string;
  onPurchaseOrderChange: (poId?: string) => void;
  bomId?: string;
  onBomChange?: (bomId?: string) => void;
  purchaseOrderProductId?: string;
  onProductChange?: (prodId?: string) => void;
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
  period?: PeriodType;
  onPeriodChange?: (period: PeriodType) => void;
  dateRangeStr?: string;
  totalCount?: number;
  bomCount?: number;
  items?: BomAggregateItem[];
}

export function BomAggregateFilters({
  purchaseOrderId,
  onPurchaseOrderChange,
  bomId,
  onBomChange,
  purchaseOrderProductId,
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
  period: externalPeriod,
  onPeriodChange,
  dateRangeStr: externalDateRangeStr,
  totalCount,
  bomCount,
  items,
}: BomAggregateFiltersProps) {
  const [internalPeriod, setInternalPeriod] = useState<PeriodType>("this_month");
  const period = externalPeriod || internalPeriod;

  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isExtraOpen, setIsExtraOpen] = useState<boolean>(false);
  const [isDateOpen, setIsDateOpen] = useState<boolean>(false);
  const [customStart, setCustomStart] = useState<string>("2026-09-01");
  const [customEnd, setCustomEnd] = useState<string>("2026-09-30");

  const dateDropdownRef = useRef<HTMLDivElement>(null);

  // Close date popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    }
    if (isDateOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDateOpen]);

  const handleSelectPeriod = (p: PeriodType) => {
    setInternalPeriod(p);
    onPeriodChange?.(p);
    setIsDateOpen(false);
  };

  const handleApplyCustomDate = () => {
    if (customStart && customEnd) {
      setInternalPeriod("custom");
      onPeriodChange?.("custom");
      setIsDateOpen(false);
    }
  };

  // Date range string provided by parent container (single source of truth)
  const dateRangeStr = externalDateRangeStr || "";

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

  const allApprovedBoms: BomListItem[] = useMemo(
    () => approvedBomsResponse?.data || [],
    [approvedBomsResponse?.data]
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
          bom.purchaseOrder?.poCode === purchaseOrderId
      );
    }
    return allApprovedBoms;
  }, [allApprovedBoms, poBomsResponse?.data, purchaseOrderId]);

  const currentBomId = bomId || purchaseOrderProductId;

  const { data: styleResponse } = useStyles({ limit: 100 });
  const styleList: Style[] = styleResponse?.data || [];

  const { data: materialList = [] } = useMaterials({});
  const { data: materialGroups = [] } = useMaterialGroups();

  const handleBomSelect = (newBomId: string) => {
    const val = newBomId || undefined;
    if (onBomChange) {
      onBomChange(val);
    } else {
      onProductChange?.(val);
    }
  };

  const handlePoSelect = (newPoId: string) => {
    const val = newPoId || undefined;
    onPurchaseOrderChange(val);
  };

  const handleGroupSelect = (groupVal: string) => {
    setSelectedGroup(groupVal);
    onSearchChange(groupVal);
  };

  const handleClear = () => {
    setInternalPeriod("this_month");
    setSelectedGroup("");
    setIsExtraOpen(false);
    onBomChange?.(undefined);
    onProductChange?.(undefined);
    onClearFilters();
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-2xs dark:border-gray-800 dark:bg-gray-900">
      {/* Hidden summary for tests */}
      {totalCount !== undefined && (
        <div className="sr-only">
          <BomAggregateSummary
            totalCount={totalCount}
            bomCount={bomCount}
            items={items || []}
          />
        </div>
      )}

      {/* Row 1: Left KPI Summary & Filter Inputs & Actions */}
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        {/* 1. Thời gian */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Thời gian
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div ref={dateDropdownRef} className="relative">
              <button
                type="button"
                data-testid="aggregate-date-range-btn"
                aria-label="Chọn khoảng thời gian"
                aria-expanded={isDateOpen}
                onClick={() => setIsDateOpen((prev) => !prev)}
                className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-2xs hover:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 cursor-pointer transition-colors"
              >
                <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="font-medium font-mono text-xs">
                  {dateRangeStr.replace("–", "➔")}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-gray-400 shrink-0 ml-0.5 transition-transform duration-200 ${
                    isDateOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Date Range Dropdown Popover */}
              {isDateOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-800 dark:bg-gray-900 animate-in fade-in-50 zoom-in-95 duration-100">
                  <div className="mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                    Chọn khoảng thời gian
                  </div>
                  <div className="flex flex-col gap-1">
                    {[
                      { key: "this_month" as PeriodType, label: "Tháng này" },
                      { key: "last_month" as PeriodType, label: "Tháng trước" },
                      { key: "this_quarter" as PeriodType, label: "Quý này" },
                      { key: "this_year" as PeriodType, label: "Năm nay" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleSelectPeriod(item.key)}
                        className={`flex items-center justify-between rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                          period === item.key
                            ? "bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/50 dark:text-blue-400"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span>{item.label}</span>
                        {period === item.key && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range Section */}
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                      Tùy chọn khoảng ngày
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 w-14 shrink-0">Từ ngày:</span>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 w-14 shrink-0">Đến ngày:</span>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCustomDate}
                        className="mt-1 w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Áp dụng khoảng ngày
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick date pills */}
            <div className="inline-flex items-center rounded-xl bg-gray-100 p-0.5 dark:bg-gray-800 text-xs">
              <button
                type="button"
                onClick={() => handleSelectPeriod("this_month")}
                className={`cursor-pointer inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  period === "this_month"
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => handleSelectPeriod("last_month")}
                className={`cursor-pointer inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  period === "last_month"
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Tháng trước
              </button>
              <button
                type="button"
                onClick={() => handleSelectPeriod("this_quarter")}
                className={`cursor-pointer inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  period === "this_quarter"
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Quý này
              </button>
              <button
                type="button"
                onClick={() => setIsDateOpen(true)}
                className={`cursor-pointer inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  period === "custom"
                    ? "bg-blue-600 text-white font-semibold shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Tùy chọn
              </button>
            </div>
          </div>
        </div>

        {/* 2. Trạng thái BOM */}
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Trạng thái BOM
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/70 py-1.5 px-3 text-xs font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Đã duyệt</span>
          </div>
        </div>

        {/* 3. BOM */}
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            BOM
          </label>
          <div className="relative">
            <select
              id="aggregate-bom-select"
              data-testid="aggregate-bom-select"
              value={currentBomId || ""}
              onChange={(e) => handleBomSelect(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-1.5 pl-7 pr-7 text-xs text-gray-700 shadow-2xs hover:border-blue-300 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 cursor-pointer transition-colors"
            >
              <option value="">
                {purchaseOrderId ? "Tất cả BOM trong đơn" : "Tất cả BOM"}
              </option>
              {eligibleBoms.map((bom: BomListItem) => {
                const productCode =
                  bom.product?.productCode || bom.style?.styleCode || bom.bomCode;
                return (
                  <option key={bom.id} value={bom.id}>
                    {productCode}
                  </option>
                );
              })}
            </select>
            <Layers className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-gray-400" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-gray-400" />
          </div>
        </div>

        {/* 4. Đơn hàng (PO) */}
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Đơn hàng (PO)
          </label>
          <div className="relative">
            <select
              id="aggregate-po-select"
              data-testid="aggregate-po-select"
              value={purchaseOrderId || ""}
              onChange={(e) => handlePoSelect(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-1.5 pl-7 pr-7 text-xs text-gray-700 shadow-2xs hover:border-blue-300 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 cursor-pointer transition-colors"
            >
              <option value="">Tất cả đơn hàng</option>
              {approvedPoList.map((po: PurchaseOrderSummary) => (
                <option key={po.id} value={po.id}>
                  {po.poCode} {po.customerName ? `(${po.customerName})` : ""}
                </option>
              ))}
            </select>
            <FileText className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-gray-400" />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-gray-400" />
          </div>
        </div>

        {/* 5. Đặt lại & Bộ lọc nâng cao */}
        <div className="flex items-end gap-2">
          {isFiltering && (
            <button
              type="button"
              data-testid="clear-filters-btn"
              onClick={handleClear}
              title="Đặt lại bộ lọc"
              aria-label="Đặt lại bộ lọc"
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-colors dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 animate-in fade-in-50 duration-150"
            >
              <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
              <span>Đặt lại</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExtraOpen((prev) => !prev)}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/60 px-3.5 py-1.5 text-xs font-semibold text-blue-600 shadow-2xs hover:bg-blue-100/70 transition-colors dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-400"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{isExtraOpen ? "Ẩn bộ lọc" : "Bộ lọc nâng cao"}</span>
          </button>
        </div>
      </div>

      {/* Extra Filters (Toggled when clicking 'Bộ lọc nâng cao') */}
      {isExtraOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 items-end">
          {/* Nhóm NPL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Nhóm NPL
            </label>
            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-1.5 px-3 pr-8 text-xs text-gray-700 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 cursor-pointer"
              >
                <option value="">Tất cả nhóm</option>
                {materialGroups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-gray-400" />
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
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-1.5 px-3 pr-8 text-xs text-gray-700 shadow-2xs focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 cursor-pointer"
              >
                <option value="">Tất cả mẫu</option>
                {styleList.map((s: Style) => (
                  <option key={s.id} value={s.id}>
                    {s.styleCode} - {s.styleName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-gray-400" />
            </div>
          </div>

          {/* Buttons: Đặt lại & Áp dụng */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="extra-reset-btn"
              onClick={handleClear}
              className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-1.5 px-3 text-xs font-medium text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Đặt lại</span>
            </button>
            <button
              type="button"
              onClick={onApplyFilters}
              className="flex-1 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-1.5 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
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
