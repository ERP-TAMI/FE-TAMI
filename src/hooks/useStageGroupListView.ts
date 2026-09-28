import { useMemo, useState } from "react";
import type { StageGroupSummary } from "@/types/stage-group";

const pageSize = 10;

/** Paginates a stage-group list already filtered by the backend (search/status go through `useStageGroups(params)`). */
export function useStageGroupListView(groups: StageGroupSummary[]) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return groups.slice(startIndex, startIndex + pageSize);
  }, [currentPage, groups]);

  return {
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: groups.length,
    paginatedGroups,
    setPage,
  };
}
