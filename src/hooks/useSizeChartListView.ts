import { useMemo, useState } from "react";
import type { SizeChart, SizeChartStatus } from "@/types/size-chart";

const pageSize = 10;

export function useSizeChartListView(sizeCharts: SizeChart[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SizeChartStatus | "">("");
  const [page, setPage] = useState(1);

  const filteredSizeCharts = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return sizeCharts.filter((sizeChart) => {
      const searchable = [sizeChart.name, ...sizeChart.sizes];
      const matchesSearch =
        !keyword || searchable.some((value) => value.toLocaleLowerCase("vi").includes(keyword));
      return matchesSearch && (!status || sizeChart.status === status);
    });
  }, [search, sizeCharts, status]);

  const totalPages = Math.max(1, Math.ceil(filteredSizeCharts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedSizeCharts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSizeCharts.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredSizeCharts]);

  return {
    search,
    status,
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: filteredSizeCharts.length,
    paginatedSizeCharts,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setStatus: (value: SizeChartStatus | "") => {
      setStatus(value);
      setPage(1);
    },
  };
}
