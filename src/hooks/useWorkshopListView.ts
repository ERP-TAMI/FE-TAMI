import { useMemo, useState } from "react";
import type { Workshop, WorkshopStatus } from "@/types/workshop";

const pageSize = 10;

export function useWorkshopListView(workshops: Workshop[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WorkshopStatus | "">("");
  const [page, setPage] = useState(1);

  const filteredWorkshops = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return workshops.filter((workshop) => {
      const searchable = [workshop.workshopCode, workshop.name, workshop.manager ?? ""];
      const matchesSearch =
        !keyword || searchable.some((value) => value.toLocaleLowerCase("vi").includes(keyword));
      const matchesStatus = !status || workshop.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status, workshops]);

  const totalPages = Math.max(1, Math.ceil(filteredWorkshops.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedWorkshops = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredWorkshops.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredWorkshops]);

  return {
    search,
    status,
    page: currentPage,
    pageSize,
    totalPages,
    totalItems: filteredWorkshops.length,
    paginatedWorkshops,
    setPage,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    setStatus: (value: WorkshopStatus | "") => {
      setStatus(value);
      setPage(1);
    },
  };
}
