import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stageApi } from "@/api/stage.api";
import { stageKeys } from "@/api/stage.keys";
import type {
  StageListParams,
  StageSsvBulkInput,
  StageStatus,
  StageUpdateInput,
} from "@/types/stage";

export function useStages(params?: StageListParams) {
  return useQuery({ queryKey: stageKeys.list(params), queryFn: () => stageApi.list(params) });
}

export function useStage(id?: string) {
  return useQuery({
    queryKey: stageKeys.detail(id ?? ""),
    queryFn: () => stageApi.detail(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateStages() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: stageKeys.all });
}

export function useCreateStage() {
  const invalidate = useInvalidateStages();
  return useMutation({ mutationFn: stageApi.create, onSuccess: invalidate });
}

export function useUpdateStage() {
  const invalidate = useInvalidateStages();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StageUpdateInput }) =>
      stageApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateStageStatus() {
  const invalidate = useInvalidateStages();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StageStatus }) =>
      stageApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteStage() {
  const invalidate = useInvalidateStages();
  return useMutation({ mutationFn: stageApi.remove, onSuccess: invalidate });
}

export function useUpdateStageSsvBulk() {
  const invalidate = useInvalidateStages();
  return useMutation({
    mutationFn: (input: StageSsvBulkInput) => stageApi.updateSsvBulk(input),
    onSuccess: invalidate,
  });
}
