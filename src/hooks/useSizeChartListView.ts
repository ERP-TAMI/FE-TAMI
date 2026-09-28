import { useMemo, useState } from "react";
import type { SizeChart } from "@/types/size-chart";

const pageSize = 10;

/** Paginates a size-chart list already filtered by the backend (search/status go through `useSizeCharts(query)`). */
export function useSizeChartListView(sizeCharts: SizeChart[]) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(sizeCharts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedSizeCharts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sizeCharts.slice(startIndex, startIndex + pageSize);
  }, [currentPage, sizeCharts]);

  return {
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: sizeCharts.length,
    paginatedSizeCharts,
    setPage,
  };
}
