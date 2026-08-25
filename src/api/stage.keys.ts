import type { StageListParams } from "@/types/stage";

export const stageKeys = {
  all: ["stages"] as const,
  lists: () => [...stageKeys.all, "list"] as const,
  list: (params?: StageListParams) => [...stageKeys.lists(), params ?? {}] as const,
  details: () => [...stageKeys.all, "detail"] as const,
  detail: (id: string) => [...stageKeys.details(), id] as const,
};
