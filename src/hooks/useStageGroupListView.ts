import { useMemo, useState } from "react";
import type { StageGroupStatus, StageGroupSummary } from "@/types/stage-group";

const pageSize = 10;

export function useStageGroupListView(groups: StageGroupSummary[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StageGroupStatus | "">("");
  const [page, setPage] = useState(1);

  const filteredGroups = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return groups.filter((group) => {
      const matchesSearch =
        !keyword ||
        group.groupCode.toLocaleLowerCase("vi").includes(keyword) ||
        group.groupName.toLocaleLowerCase("vi").includes(keyword);
      return matchesSearch && (!status || group.status === status);
    });
  }, [groups, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredGroups.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredGroups]);

  return {
    search,
    status,
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: filteredGroups.length,
    paginatedGroups,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setStatus: (value: StageGroupStatus | "") => {
      setStatus(value);
      setPage(1);
    },
  };
}
