import { Layers, Package } from "lucide-react";
import { useBomAggregate } from "@/hooks/useBoms";
import { formatUSD, formatVND, canViewBomCost } from "@/lib/bomAccess";
import { useAuthStore } from "@/store/authStore";

interface BomAggregateTabProps {
  bomId: string;
}

export function BomAggregateTab({ bomId }: BomAggregateTabProps) {
  const user = useAuthStore((state) => state.user);
  const canSeeCost = canViewBomCost(user);

  const { data: aggregateResponse, isLoading } = useBomAggregate(bomId);
  const aggregateItems = Array.isArray(aggregateResponse)
    ? aggregateResponse
    : aggregateResponse?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!aggregateItems || aggregateItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
        <Layers className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
        <p className="mt-3 font-medium text-gray-700 dark:text-gray-300">
          Chưa có dữ liệu tổng hợp nhu cầu NPL cho BOM này
        </p>
        <p className="mt-1 text-theme-xs text-gray-500">
          Dữ liệu tổng hợp chỉ khả dụng khi BOM đã được phê duyệt đóng (closed).
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-4 dark:border-gray-800">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Tổng hợp nhu cầu Nguyên phụ liệu đơn hàng (NPL Aggregate)
        </h3>
        <p className="text-theme-xs text-gray-500 dark:text-gray-400">
          Tính toán số lượng NPL cần đặt mua dựa trên định mức đã duyệt và số lượng đơn hàng PO
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-theme-sm">
          <thead>
            <tr className="border-b border-gray-200/80 bg-gray-50/75 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
              <th className="py-3.5 pl-4 pr-2">STT</th>
              <th className="px-3.5 py-3.5">Nhóm NPL</th>
              <th className="px-3.5 py-3.5">Nguyên phụ liệu</th>
              <th className="px-3.5 py-3.5 text-center">ĐVT</th>
              <th className="px-3.5 py-3.5 text-right font-bold text-brand-600 dark:text-brand-400">
                Tổng nhu cầu NPL
              </th>
              {canSeeCost && (
                <th className="py-3.5 pl-2 pr-4 text-right">Tổng chi phí ước tính ($)</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {aggregateItems.map((item, idx) => (
              <tr
                key={item.materialId || idx}
                className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
              >
                <td className="py-3.5 pl-4 pr-2 font-mono text-xs text-gray-500">
                  {idx + 1}
                </td>
                <td className="px-3.5 py-3.5">
                  <span className="inline-flex items-center rounded-lg border border-gray-200/80 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {item.materialGroupSnapshot || "Khác"}
                  </span>
                </td>
                <td className="px-3.5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200/60 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {item.materialNameSnapshot}
                    </span>
                  </div>
                </td>
                <td className="px-3.5 py-3.5 text-center text-theme-xs font-medium text-gray-600 dark:text-gray-300">
                  {item.unitSnapshot}
                </td>
                <td className="px-3.5 py-3.5 text-right font-mono text-base font-bold text-brand-600 dark:text-brand-400">
                  {Number(item.totalRequiredQuantity).toLocaleString("vi-VN", {
                    maximumFractionDigits: 3,
                  })}
                </td>
                {canSeeCost && (
                  <td className="py-3.5 pl-2 pr-4 text-right font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {item.totalEstimatedCost != null ? (
                      <>
                        <span>{formatUSD(item.totalEstimatedCost)}</span>
                        <span className="sr-only">{formatVND(item.totalEstimatedCost)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
