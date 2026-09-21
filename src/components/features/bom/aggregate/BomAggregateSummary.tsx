import { Package, FileText, Info } from "lucide-react";
import type { BomAggregateItem } from "@/types/bom";

interface BomAggregateSummaryProps {
  totalCount: number;
  bomCount?: number;
  items?: BomAggregateItem[];
}

export function BomAggregateSummary({
  totalCount,
  bomCount,
  items = [],
}: BomAggregateSummaryProps) {
  // Distinct BOM count (avoiding summing occurrences across different materials)
  const totalBoms =
    bomCount !== undefined
      ? bomCount
      : items.length > 0
      ? Math.max(...items.map((it) => it.bomCount || 0), 0)
      : 0;

  return (
    <div
      data-testid="bom-aggregate-summary"
      className="flex flex-wrap items-center gap-3 shrink-0"
    >
      {/* 1. Loại nguyên phụ liệu */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50/70 px-3.5 py-2 transition-all hover:bg-gray-100/70 dark:border-gray-800 dark:bg-gray-800/40">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          <Package className="h-5 w-5 stroke-[1.8]" />
        </div>
        <div className="min-w-0">
          <div className="font-mono text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            {totalCount}
          </div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Loại nguyên phụ liệu
            <span className="sr-only">Tổng số loại NPL</span>
          </span>
        </div>
      </div>

      {/* 2. BOM đã duyệt */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50/70 px-3.5 py-2 transition-all hover:bg-gray-100/70 dark:border-gray-800 dark:bg-gray-800/40">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          <FileText className="h-5 w-5 stroke-[1.8]" />
        </div>
        <div className="min-w-0">
          <div className="font-mono text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            {totalBoms > 0 ? totalBoms : 0}
          </div>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            BOM đã duyệt
          </span>
        </div>
      </div>

      {/* Info Icon Tooltip */}
      <div
        className="hidden md:flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 cursor-help"
        title="Dữ liệu được cập nhật theo BOM đã duyệt trong khoảng thời gian đã chọn."
      >
        <Info className="h-4 w-4" />
      </div>
    </div>
  );
}

