import { useMemo, useState } from "react";
import type { Stage } from "@/types/stage";

const pageSize = 10;

/** Paginates a stage list already filtered by the backend (search/status go through `useStages(params)`). */
export function useStageListView(stages: Stage[]) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(stages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedStages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return stages.slice(startIndex, startIndex + pageSize);
  }, [currentPage, stages]);

  return {
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: stages.length,
    paginatedStages,
    setPage,
  };
}
