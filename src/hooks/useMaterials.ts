import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialApi } from "@/api/material.api";
import { materialKeys, unitKeys } from "@/api/material.keys";
import { unitApi } from "@/api/unit.api";
import type {
  MaterialFilters,
  MaterialInput,
  MaterialStatus,
  MaterialUpdateInput,
} from "@/types/material";

export function useMaterials(filters: MaterialFilters) {
  return useQuery({
    queryKey: materialKeys.list(filters),
    queryFn: () => materialApi.list(filters),
  });
}

export function useActiveUnits() {
  return useQuery({ queryKey: unitKeys.list("active"), queryFn: () => unitApi.list("active") });
}

function useInvalidateMaterials() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: materialKeys.all });
}

export function useCreateMaterial() {
  const invalidate = useInvalidateMaterials();
  return useMutation({
    mutationFn: (input: MaterialInput) => materialApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateMaterial() {
  const invalidate = useInvalidateMaterials();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MaterialUpdateInput }) =>
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

export function useDeleteMaterial() {
  const invalidate = useInvalidateMaterials();
  return useMutation({ mutationFn: materialApi.remove, onSuccess: invalidate });
}
