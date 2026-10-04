import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { bomsApi } from "@/api/boms.api";
import { bomKeys } from "@/api/boms.keys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type {
  QueryBomsParams,
  QueryBomStatsParams,
  CreateBomPayload,
  UpdateBomPayload,
  DiscontinueBomPayload,
  RestoreBomPayload,
  DeleteBomPayload,
  SaveBomLinesPayload,
  SaveBomCostsPayload,
  PromoteRevisionPayload,
  ForwardBomPayload,
  RejectBomPayload,
  ApproveBomPayload,
  CreateRevisionPayload,
  CopyFitToPoPayload,
} from "@/types/bom";

export function useBoms(params: QueryBomsParams = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: bomKeys.list(params),
    queryFn: () => bomsApi.getBoms(params),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useEligiblePurchaseOrders(search: string, enabled: boolean) {
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  return useInfiniteQuery({
    queryKey: [...bomKeys.createTargets(), "po", debouncedSearch],
    queryFn: ({ pageParam }) => bomsApi.getEligiblePurchaseOrders(debouncedSearch, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled,
  });
}

export function useEligibleFitStyles(search: string, enabled: boolean) {
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  return useInfiniteQuery({
    queryKey: [...bomKeys.createTargets(), "fit", debouncedSearch],
    queryFn: ({ pageParam }) => bomsApi.getEligibleFitStyles(debouncedSearch, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled,
  });
}

export function useMultiEligiblePoProducts(poIds: string[]) {
  return useQueries({
    queries: poIds.map((poId) => ({
      queryKey: [...bomKeys.createTargets(), "po", poId, "products"],
      queryFn: () => bomsApi.getEligiblePoProducts(poId),
      enabled: Boolean(poId),
    })),
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
      void queryClient.invalidateQueries({ queryKey: bomKeys.createTargets() });
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

export function useRestoreBom(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RestoreBomPayload) => bomsApi.restoreBom(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bomKeys.statsAll() });
    },
  });
}

export function useDeleteBom(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteBomPayload) => bomsApi.deleteBom(bomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: bomKeys.statsAll() });
    },
  });
}

export function useSaveBomLines(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBomLinesPayload) => bomsApi.saveLines(bomId, payload),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists(), refetchType: "none" });
      void queryClient.invalidateQueries({ queryKey: bomKeys.aggregates(), refetchType: "none" });
      await queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
    },
  });
}

export function useSaveBomCosts(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveBomCostsPayload) => bomsApi.saveCosts(bomId, payload),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: bomKeys.lists(), refetchType: "none" });
      void queryClient.invalidateQueries({ queryKey: bomKeys.aggregates(), refetchType: "none" });
      await queryClient.invalidateQueries({ queryKey: bomKeys.detail(bomId) });
    },
  });
}

export function usePromoteBomRevision(bomId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      revisionId,
      payload,
    }: {
      revisionId: string;
      payload: PromoteRevisionPayload;
    }) => bomsApi.promoteRevision(bomId, revisionId, payload),
    onSuccess: () => {
      // Promote đổi bản hiện hành của cả BOM nên làm mới mọi thứ thuộc BOM
      void queryClient.invalidateQueries({ queryKey: bomKeys.all });
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
    refetchOnWindowFocus: true,
  });
}

export function useBomRevisionDiff(
  bomId: string | undefined,
  revisionId: string | undefined,
  compareWithId?: string,
) {
  return useQuery({
    queryKey: bomKeys.revisionDiff(bomId || "", revisionId || "", compareWithId),
    queryFn: () => bomsApi.getRevisionDiff(bomId!, revisionId!, compareWithId),
    enabled: Boolean(bomId && revisionId),
    refetchOnWindowFocus: true,
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
  params?: Record<string, unknown>,
) {
  const bomId = typeof idOrParams === "string" ? idOrParams : idOrParams?.bomId;
  const queryParams =
    typeof idOrParams === "object" ? (idOrParams as Record<string, unknown>) : params;

  return useQuery({
    queryKey: bomKeys.aggregate(bomId, queryParams),
    queryFn: () => bomsApi.getBomAggregate(idOrParams, params),
    placeholderData: keepPreviousData,
  });
}
