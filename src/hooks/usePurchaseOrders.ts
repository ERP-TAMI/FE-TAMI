import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { poApi, type UploadProgress } from "@/api/po.api";
import type {
  CreatePoInput,
  CreatePoProductInput,
  LinkPoDocumentInput,
  PoQuery,
  UpdatePoInput,
  UpdatePoProductInput,
  PoDocumentQuery,
  PoProductQuery,
  UpdatePoStatusInput,
} from "@/types/po";

export const PO_KEYS = {
  all: ["purchase-orders"] as const,
  lists: () => [...PO_KEYS.all, "list"] as const,
  list: (query: PoQuery) => [...PO_KEYS.lists(), query] as const,
  details: () => [...PO_KEYS.all, "detail"] as const,
  detail: (id: string) => [...PO_KEYS.details(), id] as const,
  histories: () => [...PO_KEYS.all, "history"] as const,
  history: (id: string) => [...PO_KEYS.histories(), id] as const,
  documentsOf: (id: string) => [...PO_KEYS.all, "documents", id] as const,
  documents: (id: string, query: PoDocumentQuery = {}) =>
    [...PO_KEYS.documentsOf(id), query] as const,
  productsOf: (id: string) => [...PO_KEYS.all, "products", id] as const,
  products: (id: string, query: PoProductQuery = {}) =>
    [...PO_KEYS.productsOf(id), query] as const,
  productDetail: (poId: string, productId: string) =>
    [...PO_KEYS.all, "productDetail", poId, productId] as const,
  productSteps: (poId: string, productId: string) =>
    [...PO_KEYS.all, "productSteps", poId, productId] as const,
  productSamples: (poId: string, productId: string) =>
    [...PO_KEYS.all, "productSamples", poId, productId] as const,
  productProductionDoc: (poId: string, productId: string) =>
    [...PO_KEYS.all, "productProductionDoc", poId, productId] as const,
  fitPreview: (styleId: string) => ["styles", "fitPreview", styleId] as const,
};

export function usePurchaseOrders(query: PoQuery = {}) {
  return useQuery({
    queryKey: PO_KEYS.list(query),
    queryFn: () => poApi.findAll(query),
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: PO_KEYS.detail(id || ""),
    queryFn: () => poApi.findOne(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePoInput) => poApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePoInput }) =>
      poApi.update(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() });
      queryClient.setQueryData(PO_KEYS.detail(updated.id), updated);
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => poApi.remove(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() });
      queryClient.removeQueries({ queryKey: PO_KEYS.detail(id) });
    },
  });
}

export function useUpdatePoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePoStatusInput }) =>
      poApi.updateStatus(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() });
      queryClient.setQueryData(PO_KEYS.detail(updated.id), updated);
    },
  });
}

export function useLinkPoDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LinkPoDocumentInput }) =>
      poApi.linkDocument(id, input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.documentsOf(id) });
    },
  });
}

export function useUnlinkPoDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, documentId }: { id: string; documentId: string }) =>
      poApi.unlinkDocument(id, documentId),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.documentsOf(id) });
    },
  });
}

export function useUpdatePoDocumentPurpose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      documentId,
      purpose,
    }: {
      id: string;
      documentId: string;
      purpose: string;
    }) => poApi.updateDocumentPurpose(id, documentId, purpose),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.documentsOf(id) });
    },
  });
}

export function useUploadPoDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      file,
      purpose,
    }: {
      id: string;
      file: File;
      purpose?: string;
    }) => poApi.uploadDocument(id, file, purpose),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.documentsOf(id) });
    },
  });
}

export function useUploadPoDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      files,
      purpose,
      onProgress,
    }: {
      id: string;
      files: File[];
      purpose?: string;
      onProgress?: (p: UploadProgress) => void;
    }) => poApi.uploadDocuments(id, files, purpose, { onProgress }),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.documentsOf(id) });
    },
  });
}

/**
 * Danh sách tài liệu của PO, có phân trang.
 *
 * Tách khỏi thông tin chung vì mỗi tài liệu kèm một presigned URL S3 — gộp vào
 * payload chi tiết khiến mỗi lần mở PO phải ký lại toàn bộ link dù không ai mở
 * tab Tài liệu.
 */
export function usePoDocuments(
  id: string | undefined,
  query: PoDocumentQuery = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: PO_KEYS.documents(id || "", query),
    queryFn: () => poApi.getDocuments(id!, query),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

/**
 * Danh sách sản phẩm của PO.
 *
 * Truyền `enabled: false` để hoãn gọi API cho tới khi thực sự cần — màn chi
 * tiết PO chỉ bật khi người dùng mở tab Sản phẩm, tránh tải danh sách này
 * ngay lúc vào trang.
 */
export function usePoProducts(
  id: string | undefined,
  query: PoProductQuery = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: PO_KEYS.products(id || "", query),
    queryFn: () => poApi.getProducts(id!, query),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

/**
 * Lấy danh sách sản phẩm cho nhiều PO cùng lúc (song song qua useQueries).
 */
export function useMultiPoProducts(
  poIds: string[],
  query: PoProductQuery = {},
) {
  return useQueries({
    queries: poIds.map((poId) => ({
      queryKey: PO_KEYS.products(poId, query),
      queryFn: () => poApi.getProducts(poId, query),
      enabled: Boolean(poId),
    })),
  });
}

export function useAddPoProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreatePoProductInput;
    }) => poApi.addProduct(id, input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() });
    },
  });
}

export function useUpdatePoProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      productId,
      input,
    }: {
      id: string;
      productId: string;
      input: UpdatePoProductInput;
    }) => poApi.updateProduct(id, productId, input),
    onSuccess: (_, { id, productId }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(id, productId),
      });
    },
  });
}

export function useRemovePoProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      productId,
    }: {
      id: string;
      productId: string;
    }) => poApi.removeProduct(id, productId),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() });
    },
  });
}

// ─── Fit Import Preview Hook ────────────────────────────────────────────────

export function useImportFitPreview(styleId: string | undefined) {
  return useQuery({
    queryKey: PO_KEYS.fitPreview(styleId || ""),
    queryFn: () => poApi.getImportFitPreview(styleId!),
    enabled: Boolean(styleId),
  });
}

// ─── Product Detail & Sub-resources Hooks ───────────────────────────────────

export function usePoProductDetail(
  poId: string | undefined,
  productId: string | undefined,
) {
  return useQuery({
    queryKey: PO_KEYS.productDetail(poId || "", productId || ""),
    queryFn: () => poApi.getProductDetail(poId!, productId!),
    enabled: Boolean(poId && productId),
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      status,
      reason,
    }: {
      poId: string;
      productId: string;
      status: string;
      reason?: string;
    }) => poApi.updateProductStatus(poId, productId, status, reason),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(poId) });
    },
  });
}

export function useLinkProductDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      documentId,
      purpose,
    }: {
      poId: string;
      productId: string;
      documentId: string;
      purpose?: string;
    }) => poApi.linkProductDocument(poId, productId, documentId, purpose),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(poId) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(poId) });
    },
  });
}

export function useUpdateProductDocumentPurpose() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      documentId,
      purpose,
    }: {
      poId: string;
      productId: string;
      documentId: string;
      purpose: string;
    }) => poApi.updateProductDocumentPurpose(poId, productId, documentId, purpose),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(poId) });
    },
  });
}

export function useUnlinkProductDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      documentId,
    }: {
      poId: string;
      productId: string;
      documentId: string;
    }) => poApi.unlinkProductDocument(poId, productId, documentId),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(poId) });
    },
  });
}

export function useUploadProductDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      file,
      purpose,
    }: {
      poId: string;
      productId: string;
      file: File;
      purpose?: string;
    }) => poApi.uploadProductDocument(poId, productId, file, purpose),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(poId) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(poId) });
    },
  });
}

export function useUploadProductDocumentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      documentId,
      file,
      purpose,
      changeReason,
    }: {
      poId: string;
      productId: string;
      documentId: string;
      file: File;
      purpose: string;
      changeReason?: string;
    }) =>
      poApi.uploadProductDocumentVersion(
        poId,
        productId,
        documentId,
        file,
        purpose,
        changeReason,
      ),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.productsOf(poId) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(poId) });
    },
  });
}

export function useProductOperationSteps(
  poId: string | undefined,
  productId: string | undefined,
) {
  return useQuery({
    queryKey: PO_KEYS.productSteps(poId || "", productId || ""),
    queryFn: () => poApi.getProductOperationSteps(poId!, productId!),
    enabled: Boolean(poId && productId),
  });
}

export function useSaveProductOperationSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      input,
    }: {
      poId: string;
      productId: string;
      input: import("@/types/po").SaveProductOperationStepsInput;
    }) => poApi.saveProductOperationSteps(poId, productId, input),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productSteps(poId, productId),
      });
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
    },
  });
}

export function useProductSampleRounds(
  poId: string | undefined,
  productId: string | undefined,
) {
  return useQuery({
    queryKey: PO_KEYS.productSamples(poId || "", productId || ""),
    queryFn: () => poApi.getProductSampleRounds(poId!, productId!),
    enabled: Boolean(poId && productId),
  });
}

export function useCreateProductSampleRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      input,
    }: {
      poId: string;
      productId: string;
      input: import("@/types/po").CreateProductSampleRoundInput;
    }) => poApi.createProductSampleRound(poId, productId, input),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productSamples(poId, productId),
      });
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
    },
  });
}

export function useProductProductionDoc(
  poId: string | undefined,
  productId: string | undefined,
) {
  return useQuery({
    queryKey: PO_KEYS.productProductionDoc(poId || "", productId || ""),
    queryFn: () => poApi.getProductProductionDoc(poId!, productId!),
    enabled: Boolean(poId && productId),
  });
}

export function useUpdateProductProductionDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      poId,
      productId,
      data,
    }: {
      poId: string;
      productId: string;
      data: Record<string, unknown>;
    }) => poApi.updateProductProductionDoc(poId, productId, data),
    onSuccess: (_, { poId, productId }) => {
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productProductionDoc(poId, productId),
      });
      void queryClient.invalidateQueries({
        queryKey: PO_KEYS.productDetail(poId, productId),
      });
    },
  });
}

