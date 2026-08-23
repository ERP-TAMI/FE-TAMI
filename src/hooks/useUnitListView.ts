import { useMemo, useState } from "react";
import type { MaterialStatus, Unit } from "@/types/material";

const pageSize = 5;

export function useUnitListView(units: Unit[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MaterialStatus | "">("");
  const [page, setPage] = useState(1);

  const filteredUnits = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return units.filter((unit) => {
      const matchesSearch = !keyword || unit.name.toLocaleLowerCase("vi").includes(keyword);
      const matchesStatus = !status || unit.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [units, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUnits.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredUnits]);

  return {
    search,
    status,
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: filteredUnits.length,
    paginatedUnits,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setStatus: (value: MaterialStatus | "") => {
      setStatus(value);
      setPage(1);
    },
  };
}
