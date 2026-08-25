import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { styleOperationStepsApi, type BulkSaveStyleOperationStepsPayload, type StyleOperationStepItem } from "@/api/styleOperationStepsApi";
import { stageGroupApi } from "@/api/stageGroup.api";
import { styleKeys } from "./useStyles";

export const styleStepKeys = {
  all: ["style-steps"] as const,
  byStyle: (styleId: string) => [...styleStepKeys.all, styleId] as const,
  stageGroups: ["stage-groups"] as const,
};

export function useStyleOperationSteps(styleId?: string) {
  return useQuery({
    queryKey: styleStepKeys.byStyle(styleId ?? ""),
    queryFn: () => styleOperationStepsApi.getSteps(styleId as string),
    enabled: Boolean(styleId),
  });
}

export function useStageGroups() {
  return useQuery({
    queryKey: styleStepKeys.stageGroups,
    queryFn: () => stageGroupApi.getStageGroups(),
  });
}

export function useBulkSaveStyleOperationSteps(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkSaveStyleOperationStepsPayload | Partial<StyleOperationStepItem>[]) =>
      styleOperationStepsApi.bulkSaveSteps(styleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleStepKeys.byStyle(styleId) });
      queryClient.invalidateQueries({ queryKey: styleKeys.detail(styleId) });
    },
  });
}

export function useReorderStyleOperationSteps(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      styleOperationStepsApi.reorderSteps(styleId, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleStepKeys.byStyle(styleId) });
    },
  });
}

export function useDeleteStyleOperationStep(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => styleOperationStepsApi.deleteStep(styleId, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleStepKeys.byStyle(styleId) });
    },
  });
}
