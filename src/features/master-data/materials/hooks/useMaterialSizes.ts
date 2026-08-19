import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { materialSizeApi } from "../api/material-size.api";
import type { MaterialSizeInput, MaterialSizeStatus } from "../types/material-size.types";
const key = (materialId: string) => ["material-sizes", materialId] as const;
export const useMaterialSizes = (materialId?: string) =>
  useQuery({
    queryKey: key(materialId ?? ""),
    queryFn: () => materialSizeApi.list(materialId!),
    enabled: Boolean(materialId),
  });
function useInvalidateMaterialSizes(materialId: string) {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: key(materialId) });
}
export function useCreateMaterialSize(materialId: string) {
  const done = useInvalidateMaterialSizes(materialId);
  return useMutation({
    mutationFn: (input: MaterialSizeInput) => materialSizeApi.create(materialId, input),
    onSuccess: done,
  });
}
export function useUpdateMaterialSize(materialId: string) {
  const done = useInvalidateMaterialSizes(materialId);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MaterialSizeInput> }) =>
      materialSizeApi.update(materialId, id, input),
    onSuccess: done,
  });
}
export function useUpdateMaterialSizeStatus(materialId: string) {
  const done = useInvalidateMaterialSizes(materialId);
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MaterialSizeStatus }) =>
      materialSizeApi.updateStatus(materialId, id, status),
    onSuccess: done,
  });
}
