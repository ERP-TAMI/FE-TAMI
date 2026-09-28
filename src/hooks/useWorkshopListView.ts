import { useMemo, useState } from "react";
import type { Workshop } from "@/types/workshop";

const pageSize = 10;

/** Paginates a workshop list already filtered by the backend (search/status go through `useWorkshops(query)`). */
export function useWorkshopListView(workshops: Workshop[]) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(workshops.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedWorkshops = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return workshops.slice(startIndex, startIndex + pageSize);
  }, [currentPage, workshops]);

  return {
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: workshops.length,
    paginatedWorkshops,
    setPage,
  };
}
