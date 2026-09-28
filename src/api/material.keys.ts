import type { MaterialFilters, UnitQuery } from "@/types/material";

export const materialKeys = {
  all: ["materials"] as const,
  lists: () => [...materialKeys.all, "list"] as const,
  list: (filters: MaterialFilters) => [...materialKeys.lists(), filters] as const,
  detail: (id: string) => [...materialKeys.all, "detail", id] as const,
};

export const unitKeys = {
  all: ["units"] as const,
  lists: () => [...unitKeys.all, "list"] as const,
  list: (query: UnitQuery = {}) => [...unitKeys.lists(), query] as const,
};
