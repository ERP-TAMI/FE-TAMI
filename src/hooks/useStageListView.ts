import { useMemo, useState } from "react";
import type { Stage, StageStatus } from "@/types/stage";

const pageSize = 10;

export function useStageListView(stages: Stage[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StageStatus | "">("");
  const [page, setPage] = useState(1);

  const filteredStages = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return stages.filter((stage) => {
      const matchesSearch =
        !keyword ||
        stage.stageCode.toLocaleLowerCase("vi").includes(keyword) ||
        stage.stageName.toLocaleLowerCase("vi").includes(keyword);
      return matchesSearch && (!status || stage.status === status);
    });
  }, [search, stages, status]);

  const totalPages = Math.max(1, Math.ceil(filteredStages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedStages = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStages.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredStages]);

  return {
    search,
    status,
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: filteredStages.length,
    paginatedStages,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setStatus: (value: StageStatus | "") => {
      setStatus(value);
      setPage(1);
    },
  };
}
