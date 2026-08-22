import { useEffect, useMemo, useState } from "react";
import type { MaterialGroup, MaterialGroupStatus } from "../types/material-group.types";

const pageSize = 5;

export function useMaterialGroupListView(materialGroups: MaterialGroup[]) {
  const [status, setStatus] = useState<MaterialGroupStatus | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredMaterialGroups = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return materialGroups.filter((group) => {
      const matchesStatus = !status || group.status === status;
      const matchesSearch =
        !keyword ||
        group.code.toLocaleLowerCase("vi").includes(keyword) ||
        group.name.toLocaleLowerCase("vi").includes(keyword);
      return matchesStatus && matchesSearch;
    });
  }, [materialGroups, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredMaterialGroups.length / pageSize));
  const paginatedMaterialGroups = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredMaterialGroups.slice(startIndex, startIndex + pageSize);
  }, [filteredMaterialGroups, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return {
    search,
    status,
    page,
    pageSize,
    totalPages,
    totalItems: filteredMaterialGroups.length,
    paginatedMaterialGroups,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setStatus: (value?: MaterialGroupStatus) => {
      setStatus(value);
      setPage(1);
    },
  };
}
