import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialApi } from "../api/material.api";
import type { MaterialInput, MaterialListFilters, MaterialStatus } from "../types/material.types";

const materialKeys = {
  all: ["materials"] as const,
  list: (filters: MaterialListFilters) => [...materialKeys.all, "list", filters] as const,
};
export function useMaterials(filters: MaterialListFilters) {
  return useQuery({
    queryKey: materialKeys.list(filters),
    queryFn: () => materialApi.list(filters),
  });
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
export function useUpdateMaterialStatus() {
  const invalidate = useInvalidateMaterials();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaterialStatus }) =>
      materialApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
}
