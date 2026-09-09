import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { poApi } from "@/api/po.api";
import type {
  CreatePoInput,
  CreatePoProductInput,
  LinkPoDocumentInput,
  PoQuery,
  UpdatePoInput,
  UpdatePoProductInput,
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
  products: (id: string) => [...PO_KEYS.all, "products", id] as const,
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
    onSuccess: (updated) => {
      queryClient.setQueryData(PO_KEYS.detail(updated.id), updated);
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
    }: {
      id: string;
      files: File[];
      purpose?: string;
    }) => poApi.uploadDocuments(id, files, purpose),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
    },
  });
}

export function usePoProducts(id: string | undefined) {
  return useQuery({
    queryKey: PO_KEYS.products(id || ""),
    queryFn: () => poApi.getProducts(id!),
    enabled: Boolean(id),
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
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.products(id) });
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
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.products(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
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
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.products(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: PO_KEYS.lists() });
    },
  });
}

