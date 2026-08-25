import type { StageGroupListParams } from "@/types/stage-group";

export const stageGroupKeys = {
  all: ["stage-groups"] as const,
  lists: () => [...stageGroupKeys.all, "list"] as const,
  list: (params?: StageGroupListParams) => [...stageGroupKeys.lists(), params ?? {}] as const,
  details: () => [...stageGroupKeys.all, "detail"] as const,
  detail: (id: string) => [...stageGroupKeys.details(), id] as const,
};
