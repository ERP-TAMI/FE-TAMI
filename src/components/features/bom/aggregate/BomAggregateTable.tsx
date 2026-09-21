import { useState, Fragment } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AggregateBreakdownType, BomAggregateItem } from "@/types/bom";
import { BomAggregateBreakdown } from "./BomAggregateBreakdown";

export function formatCost(value: number | null | undefined): string {
  if (value == null || isNaN(Number(value))) return "—";
  const num = Number(value);
  if (num === 0) return "0 ₫";
  return num.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
}

interface BomAggregateTableProps {
  items: BomAggregateItem[];
  page: number;
  limit: number;
  breakdown: AggregateBreakdownType;
  canViewCost?: boolean;
}

export function BomAggregateTable({
  items,
  page,
  limit,
  breakdown,
}: BomAggregateTableProps) {
  // Set of expanded row keys
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleRow = (rowKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const hasBreakdownMode =
    breakdown !== "none" ||
    items.some((i) => i.breakdown && i.breakdown.length > 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs" data-testid="bom-aggregate-table">
          <thead>
            <tr className="border-b border-gray-200/80 bg-gray-50/75 text-[11px] font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
              {hasBreakdownMode && (
                <th className="w-10 py-3.5 pl-4 pr-1 text-center">
                  <span className="sr-only">Mở rộng</span>
                </th>
              )}
              <th className={`py-3.5 ${hasBreakdownMode ? "px-2" : "pl-6 pr-2"} text-center w-14 text-gray-400 font-medium`}>
                #
              </th>
              <th className="w-36 px-4 py-3.5 font-semibold">Nhóm NPL</th>
              <th className="min-w-[260px] px-4 py-3.5 font-semibold">Nguyên phụ liệu</th>
              <th className="w-24 px-4 py-3.5 text-center font-semibold">ĐVT</th>
              <th className="w-36 px-4 py-3.5 text-center font-semibold">Số BOM sử dụng</th>
              <th className="w-44 px-4 py-3.5 pr-6 text-right font-bold text-gray-900 dark:text-white">
                Tổng nhu cầu
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item, idx) => {
              const rowKey = `${item.materialId}-${item.unitSnapshot}-${idx}`;
              const isExpanded = expandedKeys.has(rowKey);
              const stt = (page - 1) * limit + idx + 1;
              const breakdownItems = item.breakdown || [];

              return (
                <Fragment key={rowKey}>
                  <tr
                    key={rowKey}
                    className="group transition-colors hover:bg-gray-50/60 dark:hover:bg-gray-800/40"
                  >
                    {/* Expand toggle */}
                    {hasBreakdownMode && (
                      <td className="w-10 py-3.5 pl-4 pr-1 text-center">
                        <button
                          type="button"
                          aria-label={isExpanded ? "Thu gọn phân rã" : "Xem phân rã chi tiết"}
                          data-testid={`expand-btn-${idx}`}
                          onClick={() => toggleRow(rowKey)}
                          className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg transition-all ${
                            isExpanded
                              ? "border border-blue-200 bg-blue-50/70 text-blue-600 shadow-2xs hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
                              : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    )}

                    {/* STT */}
                    <td className={`py-3.5 text-center font-mono text-xs text-gray-400 ${hasBreakdownMode ? "w-14 px-2" : "w-14 pl-6 pr-2"}`}>
                      {stt}
                    </td>

                    {/* 1. Nhóm NPL badge */}
                    <td className="w-36 px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50">
                        {item.materialGroupSnapshot || "Khác"}
                      </span>
                    </td>

                    {/* 2. Nguyên phụ liệu */}
                    <td className="min-w-[260px] px-4 py-3.5">
                      <span className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-1">
                        {item.materialNameSnapshot}
                      </span>
                    </td>

                    {/* 3. ĐVT */}
                    <td className="w-24 px-4 py-3.5 text-center text-xs text-gray-600 dark:text-gray-300">
                      {item.unitSnapshot}
                    </td>

                    {/* 4. Số BOM sử dụng */}
                    <td className="w-36 px-4 py-3.5 text-center font-medium text-xs text-gray-700 dark:text-gray-300">
                      {item.bomCount}
                    </td>

                    {/* 5. Tổng nhu cầu (Blue bold text) */}
                    <td className="w-44 px-4 py-3.5 pr-6 text-right font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {Number(item.totalRequiredQuantity).toLocaleString("vi-VN", {
                        maximumFractionDigits: 4,
                      })}
                    </td>
                  </tr>

                  {/* Expandable Breakdown Drawer */}
                  {hasBreakdownMode && isExpanded && (
                    <tr key={`${rowKey}-breakdown`}>
                      <td colSpan={hasBreakdownMode ? 7 : 6} className="p-0 border-t border-gray-100 bg-gray-50/40 dark:border-gray-800 dark:bg-gray-800/20">
                        <div className="p-4">
                          <BomAggregateBreakdown
                            breakdownType={breakdown}
                            items={breakdownItems}
                            unitSnapshot={item.unitSnapshot}
                            materialName={item.materialNameSnapshot}
                            totalRequiredQuantity={item.totalRequiredQuantity}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

