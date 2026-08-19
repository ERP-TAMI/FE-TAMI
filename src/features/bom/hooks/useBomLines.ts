import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bomApi } from "../api/bom.api";
import type { CreateBomLineInput } from "../types/bom.types";

const bomKeys = {
  lines: (bomId: string) => ["bom-lines", bomId] as const,
  materials: (search: string) => ["bom-material-options", { search }] as const,
};

export function useBomLines(bomId?: string) {
  return useQuery({
    queryKey: bomKeys.lines(bomId ?? ""),
    queryFn: () => bomApi.listLines(bomId!),
    enabled: Boolean(bomId),
  });
}

export function useBomMaterialOptions(search: string) {
  return useQuery({
    queryKey: bomKeys.materials(search),
    queryFn: () => bomApi.listMaterialOptions(search),
  });
}

export function useAddBomLine(bomId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBomLineInput) => bomApi.addLine(bomId, input),
    onSuccess: () => client.invalidateQueries({ queryKey: bomKeys.lines(bomId) }),
  });
}
