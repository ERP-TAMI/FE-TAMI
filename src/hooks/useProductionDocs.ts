import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productionDocApi } from "@/api/production-doc.api";
import type {
  CreateStyleProductionDocInput,
  CopyProductionDocInput,
  ProductionDocStatus,
  ResyncProductionDocInput,
  UpdateStyleProductionDocInput,
} from "@/types/production-doc";

export const productionDocKeys = {
  all: ["production-docs"] as const,
  detail: (styleId?: string) => [...productionDocKeys.all, styleId] as const,
};

export function useProductionDoc(styleId?: string) {
  return useQuery({
    queryKey: productionDocKeys.detail(styleId),
    queryFn: () => (styleId ? productionDocApi.findByStyleId(styleId) : null),
    enabled: Boolean(styleId),
  });
}

export function useCreateProductionDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      styleId,
      input,
    }: {
      styleId: string;
      input: CreateStyleProductionDocInput;
    }) => productionDocApi.create(styleId, input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productionDocKeys.detail(variables.styleId),
      });
    },
  });
}

export function useUpdateProductionDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      styleId,
      docId,
      input,
    }: {
      styleId: string;
      docId: string;
      input: UpdateStyleProductionDocInput;
    }) => productionDocApi.update(styleId, docId, input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productionDocKeys.detail(variables.styleId),
      });
    },
  });
}

export function useUpdateProductionDocStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      styleId,
      docId,
      status,
    }: {
      styleId: string;
      docId: string;
      status: ProductionDocStatus;
    }) => productionDocApi.updateStatus(styleId, docId, status),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productionDocKeys.detail(variables.styleId),
      });
    },
  });
}

export function useResyncProductionDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      styleId,
      docId,
      input,
    }: {
      styleId: string;
      docId: string;
      input: ResyncProductionDocInput;
    }) => productionDocApi.resync(styleId, docId, input),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productionDocKeys.detail(variables.styleId),
      });
    },
  });
}

export function useCopyProductionDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      styleId,
      docId,
      input,
    }: {
      styleId: string;
      docId: string;
      input: CopyProductionDocInput;
    }) => productionDocApi.copyToStyle(styleId, docId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: productionDocKeys.all,
      });
    },
  });
}

export function useExportProductionDocExcel() {
  return useMutation({
    mutationFn: async ({ styleId, styleCode }: { styleId: string; styleCode?: string }) => {
      const blob = await productionDocApi.exportExcel(styleId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Style_Production_Doc_${styleCode || styleId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useLinkProductionDocAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      styleId,
      docId,
      documentId,
    }: {
      styleId: string;
      docId: string;
      documentId: string;
    }) => productionDocApi.linkAttachment(styleId, docId, documentId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productionDocKeys.detail(variables.styleId),
      });
    },
  });
}

export function useUnlinkProductionDocAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      styleId,
      docId,
      documentId,
    }: {
      styleId: string;
      docId: string;
      documentId: string;
    }) => productionDocApi.unlinkAttachment(styleId, docId, documentId),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: productionDocKeys.detail(variables.styleId),
      });
    },
  });
}
