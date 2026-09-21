import { useState, useEffect } from "react";
import { Search, RotateCw } from "lucide-react";
import type { BomType } from "@/types/bom";
import { BOM_STATUS_OPTIONS } from "@/lib/bomAccess";

interface BomFiltersProps {
  type: BomType | "all";
  onTypeChange: (type: BomType | "all") => void;
  status: string;
  onStatusChange: (status: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  isFiltering: boolean;
  onClearFilters: () => void;
}

export function BomFilters({
  type,
  onTypeChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
  isFiltering,
  onClearFilters,
}: BomFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [poFilter, setPoFilter] = useState("");
  const [colorFilter, setColorFilter] = useState("");

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const combined = [poFilter, localSearch, colorFilter]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" ");

      if (combined !== search) {
        onSearchChange(combined);
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [localSearch, poFilter, colorFilter, search, onSearchChange]);

  const handleClearAll = () => {
    setLocalSearch("");
    setPoFilter("");
    setColorFilter("");
    onClearFilters();
  };

  const hasAnyFilter =
    isFiltering ||
    Boolean(poFilter.trim()) ||
    Boolean(colorFilter.trim()) ||
    Boolean(localSearch.trim());

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
      {/* Left: Segmented Tabs & Dropdown */}
      <div className="flex flex-wrap items-center gap-3">
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
      </div>

      {/* Right: Search Inputs + Làm mới */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mã PO Search */}
        <div className="relative w-28 sm:w-32">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={poFilter}
            onChange={(e) => setPoFilter(e.target.value)}
            placeholder="Mã PO...."
            className="w-full rounded-xl border border-gray-200/80 bg-white py-1.5 pr-2.5 pl-8 text-xs text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {/* Mã Fit / Style / Sản phẩm Search */}
        <div className="relative min-w-[200px] flex-1 sm:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Mã Fit / Style / Sản phẩm..."
            className="w-full rounded-xl border border-gray-200/80 bg-white py-1.5 pr-2.5 pl-8 text-xs text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {/* Màu Search */}
        <div className="relative w-24">
          <input
            type="text"
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            placeholder="Màu..."
            className="w-full rounded-xl border border-gray-200/80 bg-white py-1.5 px-3 text-xs text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {/* Nút Làm mới */}
        <button
          type="button"
          onClick={handleClearAll}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-xs transition-colors ${
            hasAnyFilter
              ? "border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-900/60 dark:bg-brand-950/40 dark:text-brand-300"
              : "border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>{hasAnyFilter ? "Xóa lọc" : "Làm mới"}</span>
        </button>
      </div>
    </div>
  );
}
