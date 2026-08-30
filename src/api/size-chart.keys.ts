import type { SizeChartQuery } from "@/types/size-chart";

export const sizeChartKeys = {
  all: ["size-charts"] as const,
  lists: () => [...sizeChartKeys.all, "list"] as const,
  list: (query: SizeChartQuery = {}) => [...sizeChartKeys.lists(), query] as const,
  details: () => [...sizeChartKeys.all, "detail"] as const,
  detail: (id: string) => [...sizeChartKeys.details(), id] as const,
};
