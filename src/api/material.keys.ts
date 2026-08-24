import type { MaterialFilters } from "@/types/material";

export const materialKeys = {
  all: ["materials"] as const,
  lists: () => [...materialKeys.all, "list"] as const,
  list: (filters: MaterialFilters) => [...materialKeys.lists(), filters] as const,
  detail: (id: string) => [...materialKeys.all, "detail", id] as const,
};

export const unitKeys = {
  all: ["units"] as const,
  list: (status?: "active" | "inactive") => [...unitKeys.all, "list", { status }] as const,
};
