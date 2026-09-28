import type { MaterialGroupQuery } from "@/types/material-group";

export const materialGroupKeys = {
  all: ["material-groups"] as const,
  lists: () => [...materialGroupKeys.all, "list"] as const,
  list: (query: MaterialGroupQuery = {}) => [...materialGroupKeys.lists(), query] as const,
};
