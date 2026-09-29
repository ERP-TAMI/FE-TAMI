import { Plus, Search } from "lucide-react";
import type { BomType } from "@/types/bom";
import { BOM_STATUS_OPTIONS } from "@/lib/bomAccess";
import { BomAggregatePeriodFilter } from "@/components/features/bom/aggregate/BomAggregatePeriodFilter";
import type { PeriodMode } from "@/components/features/bom/BomStatsCards";

interface BomFiltersProps {
  type: BomType | "all";
  onTypeChange: (type: BomType | "all") => void;
  status: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  periodMode: PeriodMode;
  onPeriodModeChange: (mode: PeriodMode) => void;
  month: string;
  onMonthChange: (month: string) => void;
  year: string;
  onYearChange: (year: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function BomFilters({
  type,
  onTypeChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
  periodMode,
  onPeriodModeChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  canCreate,
  onCreateClick,
}: BomFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      {/* Left: Search, Segmented Tabs & Dropdown */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1 sm:w-72 sm:flex-none">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã PO, mẫu Fit, sản phẩm, màu..."
            className="w-full rounded-xl border border-gray-200/80 bg-white py-1.5 pr-2.5 pl-8 text-xs text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {/* Type Segmented Buttons */}
        <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => onTypeChange("all")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              type === "all"
                ? "bg-brand-600 text-white shadow-xs dark:bg-brand-500 font-semibold"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("fit")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              type === "fit"
                ? "bg-[#6370A0] text-white shadow-xs font-semibold"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Mẫu Fit
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("po")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              type === "po"
                ? "bg-brand-600 text-white shadow-xs font-semibold"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Sản phẩm PO
          </button>
        </div>

        {/* Status Dropdown */}
        <select
          value={status || "all"}
          onChange={(e) => onStatusChange(e.target.value === "all" ? "" : e.target.value)}
          className="rounded-xl border border-gray-200/80 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          aria-label="Lọc theo trạng thái"
        >
          {BOM_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Period Filter */}
        <BomAggregatePeriodFilter
          periodMode={periodMode}
          onPeriodModeChange={onPeriodModeChange}
          month={month}
          onMonthChange={onMonthChange}
          year={year}
          onYearChange={onYearChange}
          startDate={startDate}
          onStartDateChange={onStartDateChange}
          endDate={endDate}
          onEndDateChange={onEndDateChange}
        />
      </div>

      {/* Right: Create action */}
      {canCreate && (
        <button
          type="button"
          onClick={onCreateClick}
          aria-label="Thêm nguyên liệu - Tạo BOM"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm nguyên liệu</span>
        </button>
      )}
    </div>
  );
}
