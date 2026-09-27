import apiClient from "@/lib/apiClient";
import type {
  PresignStyleDocumentResponse,
  StyleDocumentItem,
  StyleDocumentViewUrlResponse,
} from "@/types/style-document";

export const styleDocumentsApi = {
  presign: async (
    styleId: string,
    file: File,
  ): Promise<PresignStyleDocumentResponse> => {
    const res = await apiClient.post<PresignStyleDocumentResponse>(
      `/styles/${styleId}/documents/presign`,
      { fileName: file.name, mimeType: file.type, sizeBytes: file.size },
    );
    return res.data;
  },

  uploadToS3: async (uploadUrl: string, file: File): Promise<void> => {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Tải tệp lên thất bại (HTTP ${res.status}).`);
    }
  },

  confirm: async (
    styleId: string,
    payload: {
      objectKey: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
    },
  ): Promise<StyleDocumentItem> => {
    const res = await apiClient.post<StyleDocumentItem>(
      `/styles/${styleId}/documents/confirm`,
      payload,
    );
    return res.data;
  },

  list: async (styleId: string): Promise<StyleDocumentItem[]> => {
    const res = await apiClient.get<StyleDocumentItem[]>(
      `/styles/${styleId}/documents`,
    );
    return res.data;
  },

  getViewUrl: async (
    styleId: string,
    documentId: string,
    download: boolean,
  ): Promise<StyleDocumentViewUrlResponse> => {
    const res = await apiClient.get<StyleDocumentViewUrlResponse>(
      `/styles/${styleId}/documents/${documentId}/view-url`,
      { params: download ? { download: "true" } : undefined },
    );
    return res.data;
  },

  remove: async (styleId: string, documentId: string): Promise<void> => {
    await apiClient.delete(`/styles/${styleId}/documents/${documentId}`);
  },
};
