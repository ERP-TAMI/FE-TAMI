import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialApi } from "@/api/material.api";
import { materialKeys, unitKeys } from "@/api/material.keys";
import { unitApi, type UnitInput } from "@/api/unit.api";
import type {
  MaterialFilters,
  MaterialInput,
  MaterialStatus,
  MaterialUpdateInput,
  UnitQuery,
} from "@/types/material";

export function useMaterials(
  filters: MaterialFilters,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: materialKeys.list(filters),
    queryFn: () => materialApi.list(filters),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useActiveUnits(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: unitKeys.list({ status: "active", limit: 100 }),
    queryFn: () => unitApi.list({ status: "active", limit: 100 }),
    enabled: options?.enabled ?? true,
  });
}

export function useUnits(query: UnitQuery = {}) {
  return useQuery({ queryKey: unitKeys.list(query), queryFn: () => unitApi.list(query) });
}

function useInvalidateUnits() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: unitKeys.all });
}

export function useCreateUnit() {
  const invalidate = useInvalidateUnits();
  return useMutation({ mutationFn: unitApi.create, onSuccess: invalidate });
}

export function useUpdateUnit() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<UnitInput> }) =>
      unitApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useUpdateUnitStatus() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaterialStatus }) =>
      unitApi.updateStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteUnit() {
  const invalidate = useInvalidateUnits();
  return useMutation({ mutationFn: unitApi.remove, onSuccess: invalidate });
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
