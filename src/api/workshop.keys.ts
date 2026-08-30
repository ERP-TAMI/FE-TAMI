import type { WorkshopQuery } from "@/types/workshop";

export const workshopKeys = {
  all: ["workshops"] as const,
  lists: () => [...workshopKeys.all, "list"] as const,
  list: (query: WorkshopQuery = {}) => [...workshopKeys.lists(), query] as const,
  details: () => [...workshopKeys.all, "detail"] as const,
  detail: (id: string) => [...workshopKeys.details(), id] as const,
};
