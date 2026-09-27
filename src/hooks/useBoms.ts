import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { bomsApi } from "@/api/boms.api";
import { bomKeys } from "@/api/boms.keys";
import type {
  QueryBomsParams,
  QueryBomStatsParams,
  CreateBomPayload,
  UpdateBomPayload,
  DiscontinueBomPayload,
  CreateBomLinePayload,
  UpdateBomLinePayload,
  ReorderBomLinesPayload,
  ForwardBomPayload,
  RejectBomPayload,
  ApproveBomPayload,
  CreateRevisionPayload,
  CopyFitToPoPayload,
} from "@/types/bom";

export function useBoms(
  params: QueryBomsParams = {},
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: bomKeys.list(params),
    queryFn: () => bomsApi.getBoms(params),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Lấy danh sách BOM cho nhiều PO cùng lúc (song song qua useQueries).
 */
export function useMultiPoBoms(poIds: string[]) {
  return useQueries({
    queries: poIds.map((poId) => ({
      queryKey: bomKeys.list({ purchaseOrder: poId, limit: 100 }),
      queryFn: () => bomsApi.getBoms({ purchaseOrder: poId, limit: 100 }),
      enabled: Boolean(poId),
    })),
  });
}

export function useBomStats(params: QueryBomStatsParams = {}) {
  return useQuery({
    queryKey: bomKeys.stats(params),
    queryFn: () => bomsApi.getBomStats(params),
  });
}

export function useBom(id: string | undefined) {
  return useQuery({
    queryKey: bomKeys.detail(id || ""),
    queryFn: () => bomsApi.getBomById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBomPayload) => bomsApi.createBom(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bomKeys.statsAll() });
    },
  });
}

export function useUpdateBom(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBomPayload) => bomsApi.updateBom(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
    },
  });
}

export function useDiscontinueBom(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DiscontinueBomPayload) => bomsApi.discontinueBom(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bomKeys.statsAll() });
    },
  });
}

export function useAddBomLine(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBomLinePayload) => bomsApi.addLine(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
    },
  });
}

export function useUpdateBomLine(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, payload }: { lineId: string; payload: UpdateBomLinePayload }) =>
      bomsApi.updateLine(bomId, lineId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
    },
  });
}

export function useDeleteBomLine(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lineId: string) => bomsApi.deleteLine(bomId, lineId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
    },
  });
}

export function useReorderBomLines(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReorderBomLinesPayload) => bomsApi.reorderLines(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
    },
  });
}

export function useForwardBom(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ForwardBomPayload) => bomsApi.forwardBom(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.revisions(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bomKeys.statsAll() });
    },
  });
}

export function useRejectBom(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RejectBomPayload) => bomsApi.rejectBom(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.revisions(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bomKeys.statsAll() });
    },
  });
}

export function useApproveBom(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveBomPayload) => bomsApi.approveBom(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.revisions(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bomKeys.statsAll() });
    },
  });
}

export function useCreateBomRevision(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRevisionPayload) => bomsApi.createRevision(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.revisions(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bomKeys.statsAll() });
    },
  });
}

export function useBomRevisions(bomId: string | undefined) {
  return useQuery({
    queryKey: bomKeys.revisions(bomId || ""),
    queryFn: () => bomsApi.getRevisions(bomId!),
    enabled: Boolean(bomId),
  });
}

export function useBomRevisionDetail(bomId: string | undefined, revisionId: string | undefined) {
  return useQuery({
    queryKey: bomKeys.revisionDetail(bomId || "", revisionId || ""),
    queryFn: () => bomsApi.getRevisionDetail(bomId!, revisionId!),
    enabled: Boolean(bomId && revisionId),
  });
}

export function useBomRevisionHistory(bomId: string | undefined, revisionId: string | undefined) {
  return useQuery({
    queryKey: bomKeys.revisionHistory(bomId || "", revisionId || ""),
    queryFn: () => bomsApi.getRevisionHistory(bomId!, revisionId!),
    enabled: Boolean(bomId && revisionId),
  });
}

export function useBomRevisionDiff(
  bomId: string | undefined,
  revisionId: string | undefined,
  compareWithId?: string
) {
  return useQuery({
    queryKey: bomKeys.revisionDiff(bomId || "", revisionId || "", compareWithId),
    queryFn: () => bomsApi.getRevisionDiff(bomId!, revisionId!, compareWithId),
    enabled: Boolean(bomId && revisionId),
  });
}

export function useCopyFitToPoBom(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: CopyFitToPoPayload) => bomsApi.copyFromFit(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
    },
  });
}

export function useBomAggregate(
  idOrParams?: string | import("@/types/bom").BomAggregateParams,
  params?: Record<string, unknown>
) {
  const bomId = typeof idOrParams === "string" ? idOrParams : idOrParams?.bomId;
  const queryParams =
    typeof idOrParams === "object"
      ? (idOrParams as Record<string, unknown>)
      : params;

  return useQuery({
    queryKey: bomKeys.aggregate(bomId, queryParams),
    queryFn: () => bomsApi.getBomAggregate(idOrParams, params),
  });
}
