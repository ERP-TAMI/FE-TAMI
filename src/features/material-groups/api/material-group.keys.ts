import type { MaterialGroupStatus } from "@/types/material-group";

export const materialGroupKeys = {
  all: ["material-groups"] as const,
  lists: () => [...materialGroupKeys.all, "list"] as const,
  list: (status?: MaterialGroupStatus) => [...materialGroupKeys.lists(), { status }] as const,
};
