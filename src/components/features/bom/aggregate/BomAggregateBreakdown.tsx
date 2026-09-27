import { useState, useMemo } from "react";
import { Download, PieChart } from "lucide-react";
import type { AggregateBreakdownType, BomAggregateBreakdownItem } from "@/types/bom";

interface BomAggregateBreakdownProps {
  breakdownType?: AggregateBreakdownType;
  items?: BomAggregateBreakdownItem[];
  unitSnapshot: string;
  materialName?: string;
  totalRequiredQuantity?: number;
}

import { sortSizes, getColorDotClasses } from "@/lib/bomAggregateUtils";

function csvCell(val: string | number): string {
  const str = String(val);
  if (str.includes(",") || str.includes("\"") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function BomAggregateBreakdown({
  breakdownType,
  items = [],
  unitSnapshot,
  materialName,
  totalRequiredQuantity,
}: BomAggregateBreakdownProps) {
  // Format quantity helper in Vietnamese locale
  const formatQuantity = (val: number) =>
    Number(val).toLocaleString("vi-VN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

  // Dimension selection: "color" vs "size" for Left summary panel
  const [activeDimension, setActiveDimension] = useState<"color" | "size">(() => {
    if (breakdownType === "size") return "size";
    return "color";
  });

  // Toggle viewing percentage in the matrix grid
  const [showPercent, setShowPercent] = useState<boolean>(false);

  // Aggregated data extraction
  const {
    uniqueColors,
    uniqueSizes,
    cellMap,
    colorTotals,
    sizeTotals,
    grandTotal,
    hasColors,
    hasSizes,
  } = useMemo(() => {
    const cSet = new Set<string>();
    const sSet = new Set<string>();
    const cMap = new Map<string, number>();
    const sMap = new Map<string, number>();
    const matrix = new Map<string, number>();
    let total = 0;

    items.forEach((item) => {
      const qty = Number(item.requiredQuantity) || 0;
      total += qty;

      const color = item.colorName?.trim();
      const size = item.sizeLabel?.trim();

      if (color) {
        cSet.add(color);
        cMap.set(color, (cMap.get(color) || 0) + qty);
      }
      if (size) {
        sSet.add(size);
        sMap.set(size, (sMap.get(size) || 0) + qty);
      }
      if (color && size) {
        const key = `${color}__${size}`;
        matrix.set(key, (matrix.get(key) || 0) + qty);
      }
    });

    const uColors = Array.from(cSet);
    const uSizes = sortSizes(Array.from(sSet));

    return {
      uniqueColors: uColors,
      uniqueSizes: uSizes,
      cellMap: matrix,
      colorTotals: cMap,
      sizeTotals: sMap,
      grandTotal: total || totalRequiredQuantity || 0,
      hasColors: uColors.length > 0,
      hasSizes: uSizes.length > 0,
    };
  }, [items, totalRequiredQuantity]);

  // Client-side CSV export
  const handleExport = () => {
    const safeName = (materialName || "vat-tu")
      .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, "-")
      .replace(/-+/g, "-");
    const filename = `chi-tiet-mau-size-${safeName}.csv`;
    const lines: string[] = [];

    if (hasColors && hasSizes) {
      lines.push(["Màu sắc", ...uniqueSizes, "Tổng"].map(csvCell).join(","));
      uniqueColors.forEach((color) => {
        const row = [
          color,
          ...uniqueSizes.map((size) => cellMap.get(`${color}__${size}`) ?? ""),
          colorTotals.get(color) || 0,
        ];
        lines.push(row.map(csvCell).join(","));
      });
      lines.push(
        [
          "Tổng",
          ...uniqueSizes.map((size) => sizeTotals.get(size) || 0),
          grandTotal,
        ].map(csvCell).join(",")
      );
    } else if (hasColors) {
      lines.push(["Màu sắc", "Tổng nhu cầu", "Tỷ lệ"].map(csvCell).join(","));
      uniqueColors.forEach((color) => {
        const qty = colorTotals.get(color) || 0;
        const pct = grandTotal > 0 ? ((qty / grandTotal) * 100).toFixed(1) + "%" : "0%";
        lines.push([color, qty, pct].map(csvCell).join(","));
      });
      lines.push(["Tổng", grandTotal, "100%"].map(csvCell).join(","));
    } else if (hasSizes) {
      lines.push(["Kích cỡ", "Tổng nhu cầu", "Tỷ lệ"].map(csvCell).join(","));
      uniqueSizes.forEach((size) => {
        const qty = sizeTotals.get(size) || 0;
        const pct = grandTotal > 0 ? ((qty / grandTotal) * 100).toFixed(1) + "%" : "0%";
        lines.push([size, qty, pct].map(csvCell).join(","));
      });
      lines.push(["Tổng", grandTotal, "100%"].map(csvCell).join(","));
    }

    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!items || items.length === 0) {
    return (
      <div
        data-testid="breakdown-empty"
        className="rounded-xl border border-gray-200/60 bg-gray-50/70 p-4 text-center text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400"
      >
        Không có dữ liệu phân rã chi tiết cho vật tư này
      </div>
    );
  }

  const rootTestId =
    hasColors && hasSizes
      ? "breakdown-color-size"
      : hasColors
      ? "breakdown-color"
      : "breakdown-size";

  return (
    <div
      data-testid={rootTestId}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3.5 dark:border-gray-800">
        {/* Left: Dimension Toggle (Theo màu / Theo size) */}
        <div className="inline-flex rounded-xl bg-gray-100/90 p-1 dark:bg-gray-800/80">
          <button
            type="button"
            onClick={() => setActiveDimension("color")}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              activeDimension === "color"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Theo màu
          </button>
          <button
            type="button"
            onClick={() => setActiveDimension("size")}
            className={`cursor-pointer rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              activeDimension === "size"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            Theo size
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPercent((prev) => !prev)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              showPercent
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-2xs dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 shadow-2xs"
            }`}
          >
            <PieChart className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
            <span>Xem theo %</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-600 shadow-2xs transition-all hover:bg-blue-50 hover:border-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400"
          >
            <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Xuất</span>
          </button>
        </div>
      </div>

      {/* Main 2-Panel Content */}
      <div className="mt-4 flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Panel: Summary Table */}
        <div className="w-full xl:w-[380px] shrink-0">
          <div
            data-testid={activeDimension === "color" ? "breakdown-color" : "breakdown-size"}
            className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-2xs dark:border-gray-800 dark:bg-gray-900/60"
          >
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="pb-2.5 text-left font-semibold">
                    {activeDimension === "color" ? "Màu sắc" : "Kích cỡ"}
                  </th>
                  <th className="pb-2.5 text-right font-semibold">Tổng nhu cầu</th>
                  <th className="pb-2.5 text-right font-semibold">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {activeDimension === "color"
                  ? uniqueColors.map((color) => {
                      const qty = colorTotals.get(color) || 0;
                      const bullet = getColorDotClasses(color);
                      const pct =
                        grandTotal > 0
                          ? ((qty / grandTotal) * 100).toFixed(1)
                          : "0.0";
                      return (
                        <tr key={color} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="py-2.5 text-left">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs ${bullet.bgClass} ${bullet.borderClass}`}
                              />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {color}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                            {formatQuantity(qty)}
                          </td>
                          <td className="py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })
                  : uniqueSizes.map((size) => {
                      const qty = sizeTotals.get(size) || 0;
                      const pct =
                        grandTotal > 0
                          ? ((qty / grandTotal) * 100).toFixed(1)
                          : "0.0";
                      return (
                        <tr key={size} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="py-2.5 text-left font-semibold text-gray-900 dark:text-white">
                            {size}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                            {formatQuantity(qty)}
                          </td>
                          <td className="py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
                            {pct}%
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 text-xs font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                  <td className="pt-2.5 text-left">Tổng</td>
                  <td className="pt-2.5 text-right font-mono font-bold">
                    {formatQuantity(grandTotal)}
                  </td>
                  <td className="pt-2.5 text-right font-bold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right Panel: Matrix Grid */}
        {hasColors && hasSizes ? (
          <div className="w-full flex-1 min-w-0">
            <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-2xs dark:border-gray-800 dark:bg-gray-900/60">
              <h4 className="mb-2.5 text-xs font-bold text-gray-900 dark:text-white">
                Chi tiết theo màu và size ({unitSnapshot || "ĐVT"})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      <th className="pb-2.5 text-left font-semibold">Màu sắc</th>
                      {uniqueSizes.map((size) => (
                        <th key={size} className="pb-2.5 text-center font-semibold px-2">
                          {size}
                        </th>
                      ))}
                      <th className="pb-2.5 text-right font-semibold pl-2">Tổng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {uniqueColors.map((color) => {
                      const bullet = getColorDotClasses(color);
                      const cTotal = colorTotals.get(color) || 0;
                      const cPct =
                        grandTotal > 0
                          ? ((cTotal / grandTotal) * 100).toFixed(1)
                          : "0.0";
                      return (
                        <tr key={color} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="py-2.5 text-left whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs ${bullet.bgClass} ${bullet.borderClass}`}
                              />
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {color}
                              </span>
                            </div>
                          </td>
                          {uniqueSizes.map((size) => {
                            const cellQty = cellMap.get(`${color}__${size}`);
                            const cellPct =
                              cellQty !== undefined && grandTotal > 0
                                ? ((cellQty / grandTotal) * 100).toFixed(1)
                                : "0.0";
                            return (
                              <td
                                key={size}
                                className="py-2.5 text-center font-mono text-gray-700 dark:text-gray-300 px-2"
                              >
                                {cellQty !== undefined
                                  ? showPercent
                                    ? `${cellPct}%`
                                    : formatQuantity(cellQty)
                                  : "—"}
                              </td>
                            );
                          })}
                          <td className="py-2.5 text-right font-mono font-bold text-gray-900 dark:text-white pl-2">
                            {showPercent ? `${cPct}%` : formatQuantity(cTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200 text-xs font-bold text-gray-900 dark:border-gray-700 dark:text-white">
                      <td className="pt-2.5 text-left">Tổng</td>
                      {uniqueSizes.map((size) => {
                        const sTotal = sizeTotals.get(size) || 0;
                        const sPct =
                          grandTotal > 0
                            ? ((sTotal / grandTotal) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <td
                            key={size}
                            className="pt-2.5 text-center font-mono font-bold px-2"
                          >
                            {showPercent ? `${sPct}%` : formatQuantity(sTotal)}
                          </td>
                        );
                      })}
                      <td className="pt-2.5 text-right font-mono font-bold pl-2">
                        {showPercent ? "100%" : formatQuantity(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
