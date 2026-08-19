import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialApi } from "../api/material.api";
import type { MaterialInput } from "../types/material.types";

const materialKeys = {
  all: ["materials"] as const,
  list: () => [...materialKeys.all, "list"] as const,
};
export function useMaterials() {
  return useQuery({ queryKey: materialKeys.list(), queryFn: materialApi.list });
}
function useInvalidateMaterials() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: materialKeys.all });
}
export function useCreateMaterial() {
  const invalidate = useInvalidateMaterials();
  return useMutation({ mutationFn: materialApi.create, onSuccess: invalidate });
}
export function useUpdateMaterial() {
  const invalidate = useInvalidateMaterials();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MaterialInput> }) =>
      materialApi.update(id, input),
    onSuccess: invalidate,
  });
}
