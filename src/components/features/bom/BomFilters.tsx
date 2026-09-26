import { useState, useEffect } from "react";
import { Search, RotateCw } from "lucide-react";
import type { BomType } from "@/types/bom";
import { BOM_STATUS_OPTIONS } from "@/lib/bomAccess";

interface BomFiltersProps {
  type: BomType | "all";
  onTypeChange: (type: BomType | "all") => void;
  status: string;
  onStatusChange: (status: string) => void;
  purchaseOrder: string;
  style: string;
  product: string;
  color: string;
  onFiltersChange: (filters: BomSearchFilters) => void;
  isFiltering: boolean;
  onClearFilters: () => void;
}

export interface BomSearchFilters {
  purchaseOrder: string;
  style: string;
  product: string;
  color: string;
}

export function BomFilters({
  type,
  onTypeChange,
  status,
  onStatusChange,
  purchaseOrder,
  style,
  product,
  color,
  onFiltersChange,
  isFiltering,
  onClearFilters,
}: BomFiltersProps) {
  const [poFilter, setPoFilter] = useState(purchaseOrder);
  const [styleFilter, setStyleFilter] = useState(style);
  const [productFilter, setProductFilter] = useState(product);
  const [colorFilter, setColorFilter] = useState(color);

  useEffect(() => {
    setPoFilter(purchaseOrder);
    setStyleFilter(style);
    setProductFilter(product);
    setColorFilter(color);
  }, [purchaseOrder, style, product, color]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onFiltersChange({
        purchaseOrder: poFilter.trim(),
        style: styleFilter.trim(),
        product: productFilter.trim(),
        color: colorFilter.trim(),
      });
    }, 350);
    return () => clearTimeout(handler);
  }, [poFilter, styleFilter, productFilter, colorFilter, onFiltersChange]);

  const handleClearAll = () => {
    setStyleFilter("");
    setProductFilter("");
    setPoFilter("");
    setColorFilter("");
    onClearFilters();
  };

  const hasAnyFilter =
    isFiltering ||
    Boolean(poFilter.trim()) ||
    Boolean(styleFilter.trim()) ||
    Boolean(productFilter.trim()) ||
    Boolean(colorFilter.trim());

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

        {/* Mã Fit / Style Search */}
        <div className="relative min-w-[200px] flex-1 sm:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            placeholder="Mã Fit / Style..."
            className="w-full rounded-xl border border-gray-200/80 bg-white py-1.5 pr-2.5 pl-8 text-xs text-gray-800 shadow-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {/* PO product search */}
        <div className="relative min-w-[160px] flex-1 sm:w-48">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            placeholder="Mã sản phẩm PO..."
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
