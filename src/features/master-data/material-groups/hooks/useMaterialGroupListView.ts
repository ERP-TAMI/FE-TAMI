import { useMemo, useState } from "react";
import type { MaterialGroup } from "../types/material-group.types";

const pageSize = 5;

export function useMaterialGroupListView(materialGroups: MaterialGroup[]) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredMaterialGroups = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return materialGroups.filter((group) => {
      const matchesSearch = !keyword || group.name.toLocaleLowerCase("vi").includes(keyword);
      return matchesSearch;
    });
  }, [materialGroups, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMaterialGroups.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedMaterialGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMaterialGroups.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredMaterialGroups]);

  return {
    search,
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: filteredMaterialGroups.length,
    paginatedMaterialGroups,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
  };
}
