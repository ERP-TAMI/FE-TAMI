import { useQuery } from "@tanstack/react-query";
import { nplApi } from "@/api/npl.api";
import type { NplQueryFilter } from "@/types/npl";

export const nplKeys = {
  all: ["npl"] as const,
  lists: () => [...nplKeys.all, "list"] as const,
  list: (filter?: NplQueryFilter) => [...nplKeys.lists(), filter] as const,
};

/**
 * Fetch NPL list with optional filters.
 */
export function useNplList(filter?: NplQueryFilter) {
  return useQuery({
    queryKey: nplKeys.list(filter),
    queryFn: () => nplApi.getNplList(filter),
  });
}

/**
 * Fetch aggregate NPL stats for period or all time.
 */
export function useNplStats(period?: string) {
  return useQuery({
    queryKey: [...nplKeys.all, "stats", period ?? "all"] as const,
    queryFn: () => nplApi.getStats(period),
  });
}

