import apiClient from "@/lib/apiClient";
import type {
  CreateStyleProductionDocInput,
  CopyProductionDocInput,
  ProductionDocStatus,
  ResyncProductionDocInput,
  StyleProductionDocDetail,
  UpdateStyleProductionDocInput,
} from "@/types/production-doc";

export const productionDocApi = {
  async findByStyleId(styleId: string): Promise<StyleProductionDocDetail | null> {
    const response = await apiClient.get<StyleProductionDocDetail | null>(
      `/styles/${styleId}/production-docs`,
    );
    return response.data;
  },

  async findOne(styleId: string, docId: string): Promise<StyleProductionDocDetail> {
    const response = await apiClient.get<StyleProductionDocDetail>(
      `/styles/${styleId}/production-docs/${docId}`,
    );
    return response.data;
  },

  async create(
    styleId: string,
    input: CreateStyleProductionDocInput,
  ): Promise<StyleProductionDocDetail> {
    const response = await apiClient.post<StyleProductionDocDetail>(
      `/styles/${styleId}/production-docs`,
      input,
    );
    return response.data;
  },

  async update(
    styleId: string,
    docId: string,
    input: UpdateStyleProductionDocInput,
  ): Promise<StyleProductionDocDetail> {
    const response = await apiClient.patch<StyleProductionDocDetail>(
      `/styles/${styleId}/production-docs/${docId}`,
      input,
    );
    return response.data;
  },

  async updateStatus(
    styleId: string,
    docId: string,
    status: ProductionDocStatus,
  ): Promise<StyleProductionDocDetail> {
    const response = await apiClient.patch<StyleProductionDocDetail>(
      `/styles/${styleId}/production-docs/${docId}/status`,
      { status },
    );
    return response.data;
  },

  async resync(
    styleId: string,
    docId: string,
    input: ResyncProductionDocInput,
  ): Promise<StyleProductionDocDetail> {
    const response = await apiClient.post<StyleProductionDocDetail>(
      `/styles/${styleId}/production-docs/${docId}/resync`,
      input,
    );
    return response.data;
  },

  async copyToStyle(
    styleId: string,
    docId: string,
    input: CopyProductionDocInput,
  ): Promise<StyleProductionDocDetail> {
    const response = await apiClient.post<StyleProductionDocDetail>(
      `/styles/${styleId}/production-docs/${docId}/copy`,
      input,
    );
    return response.data;
  },

  async exportExcel(styleId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/styles/${styleId}/production-docs/export-excel`,
      { responseType: "blob" },
    );
    return response.data as Blob;
  },

  async linkAttachment(
    styleId: string,
    docId: string,
    documentId: string,
  ): Promise<void> {
    await apiClient.post(`/styles/${styleId}/production-docs/${docId}/attachments`, {
      documentId,
    });
  },

  async unlinkAttachment(
    styleId: string,
    docId: string,
    documentId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/styles/${styleId}/production-docs/${docId}/attachments/${documentId}`,
    );
  },

  async remove(styleId: string, docId: string): Promise<void> {
    await apiClient.delete(`/styles/${styleId}/production-docs/${docId}`);
  },
};
