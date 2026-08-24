import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stageGroupApi } from "@/api/stage-group.api";
import { stageGroupKeys } from "@/api/stage-group.keys";
import type {
  StageGroupListParams,
  StageGroupStatus,
  StageGroupUpdateInput,
} from "@/types/stage-group";

export function useStageGroups(params?: StageGroupListParams) {
  return useQuery({
    queryKey: stageGroupKeys.list(params),
    queryFn: () => stageGroupApi.list(params),
  });
}

export function useStageGroup(id?: string) {
  return useQuery({
    queryKey: stageGroupKeys.detail(id ?? ""),
    queryFn: () => stageGroupApi.detail(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateStageGroups() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: stageGroupKeys.all });
}

export function useCreateStageGroup() {
  const invalidate = useInvalidateStageGroups();
  return useMutation({ mutationFn: stageGroupApi.create, onSuccess: invalidate });
}

export function useUpdateStageGroup() {
  const invalidate = useInvalidateStageGroups();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StageGroupUpdateInput }) =>
      stageGroupApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateStageGroupStatus() {
  const invalidate = useInvalidateStageGroups();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StageGroupStatus }) =>
      stageGroupApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteStageGroup() {
  const invalidate = useInvalidateStageGroups();
  return useMutation({ mutationFn: stageGroupApi.remove, onSuccess: invalidate });
}
