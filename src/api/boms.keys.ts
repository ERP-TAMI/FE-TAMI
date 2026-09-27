import type { QueryBomsParams, QueryBomStatsParams } from "@/types/bom";

export const bomKeys = {
  all: ["boms"] as const,
  lists: () => [...bomKeys.all, "list"] as const,
  list: (params: QueryBomsParams = {}) => [...bomKeys.lists(), params] as const,
  statsAll: () => [...bomKeys.all, "stats"] as const,
  stats: (params: QueryBomStatsParams = {}) => [...bomKeys.statsAll(), params] as const,
  details: () => [...bomKeys.all, "detail"] as const,
  detail: (id: string) => [...bomKeys.details(), id] as const,
  revisions: (bomId: string) => [...bomKeys.all, "revisions", bomId] as const,
  revisionDetail: (bomId: string, revisionId: string) =>
    [...bomKeys.all, "revision", bomId, revisionId] as const,
  revisionHistory: (bomId: string, revisionId: string) =>
    [...bomKeys.all, "history", bomId, revisionId] as const,
  revisionDiff: (bomId: string, revisionId: string, compareWithId?: string) =>
    [...bomKeys.all, "diff", bomId, revisionId, compareWithId || ""] as const,
  aggregates: () => [...bomKeys.all, "aggregate"] as const,
  aggregate: (bomId?: string, params?: Record<string, unknown>) =>
    [...bomKeys.aggregates(), bomId || "", params || {}] as const,
};

