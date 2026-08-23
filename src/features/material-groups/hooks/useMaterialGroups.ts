import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialGroupApi } from "../api/material-group.api";
import { materialGroupKeys } from "../api/material-group.keys";
import type { MaterialGroupInput, MaterialGroupStatus } from "@/types/material-group";

export function useMaterialGroups(status?: MaterialGroupStatus) {
  return useQuery({
    queryKey: materialGroupKeys.list(status),
    queryFn: () => materialGroupApi.list(status),
  });
}

function useInvalidateMaterialGroups() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: materialGroupKeys.all });
}

export function useCreateMaterialGroup() {
  const invalidate = useInvalidateMaterialGroups();
  return useMutation({ mutationFn: materialGroupApi.create, onSuccess: invalidate });
}

export function useUpdateMaterialGroup() {
  const invalidate = useInvalidateMaterialGroups();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MaterialGroupInput> }) =>
      materialGroupApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateMaterialGroupStatus() {
  const invalidate = useInvalidateMaterialGroups();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaterialGroupStatus }) =>
      materialGroupApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteMaterialGroup() {
  const invalidate = useInvalidateMaterialGroups();
  return useMutation({ mutationFn: materialGroupApi.remove, onSuccess: invalidate });
}
