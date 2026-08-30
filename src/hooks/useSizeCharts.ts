import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sizeChartApi } from "@/api/size-chart.api";
import { sizeChartKeys } from "@/api/size-chart.keys";
import type {
  CreateSizeChartInput,
  SizeChartQuery,
  SizeChartStatus,
  UpdateSizeChartInput,
} from "@/types/size-chart";

export function useSizeCharts(query: SizeChartQuery = {}) {
  return useQuery({
    queryKey: sizeChartKeys.list(query),
    queryFn: () => sizeChartApi.list(query),
  });
}

export function useActiveSizeCharts() {
  return useSizeCharts({ status: "active" });
}

export function useSizeChart(id: string) {
  return useQuery({
    queryKey: sizeChartKeys.detail(id),
    queryFn: () => sizeChartApi.detail(id),
    enabled: Boolean(id),
  });
}

function useInvalidateSizeCharts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: sizeChartKeys.all });
}

export function useCreateSizeChart() {
  const invalidate = useInvalidateSizeCharts();
  return useMutation({ mutationFn: sizeChartApi.create, onSuccess: invalidate });
}

export function useUpdateSizeChart() {
  const invalidate = useInvalidateSizeCharts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSizeChartInput }) =>
      sizeChartApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateSizeChartStatus() {
  const invalidate = useInvalidateSizeCharts();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SizeChartStatus }) =>
      sizeChartApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteSizeChart() {
  const invalidate = useInvalidateSizeCharts();
  return useMutation({ mutationFn: sizeChartApi.remove, onSuccess: invalidate });
}

export type { CreateSizeChartInput };
