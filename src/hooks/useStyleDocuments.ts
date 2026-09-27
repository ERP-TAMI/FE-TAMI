import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { styleDocumentsApi } from "@/api/style-documents.api";

export const styleDocumentKeys = {
  all: (styleId: string) => ["style-documents", styleId] as const,
};

export function useStyleDocuments(styleId?: string) {
  return useQuery({
    queryKey: styleDocumentKeys.all(styleId ?? ""),
    queryFn: () => styleDocumentsApi.list(styleId as string),
    enabled: Boolean(styleId),
  });
}

export function useUploadStyleDocument(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const presign = await styleDocumentsApi.presign(styleId, file);
      await styleDocumentsApi.uploadToS3(presign.uploadUrl, file);
      return styleDocumentsApi.confirm(styleId, {
        objectKey: presign.objectKey,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleDocumentKeys.all(styleId) });
    },
  });
}

export function useRemoveStyleDocument(styleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => styleDocumentsApi.remove(styleId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleDocumentKeys.all(styleId) });
    },
  });
}
