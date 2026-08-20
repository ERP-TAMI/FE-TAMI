import apiClient from "@/lib/apiClient";
import type {
  Style,
  CreateStylePayload,
  UpdateStylePayload,
  StyleQueryFilter,
  PaginatedResponse,
} from "@/types/style";

export const stylesApi = {
  getStyles: async (params?: StyleQueryFilter): Promise<PaginatedResponse<Style>> => {
    const res = await apiClient.get<PaginatedResponse<Style>>("/styles", { params });
    return res.data;
  },

  getStyleById: async (id: string): Promise<Style> => {
    const res = await apiClient.get<Style>(`/styles/${id}`);
    return res.data;
  },

  getStyleByCode: async (styleCode: string): Promise<Style> => {
    const res = await apiClient.get<Style>(`/styles/code/${encodeURIComponent(styleCode)}`);
    return res.data;
  },

  createStyle: async (payload: CreateStylePayload): Promise<Style> => {
    const res = await apiClient.post<Style>("/styles", payload);
    return res.data;
  },

  updateStyle: async (id: string, payload: UpdateStylePayload): Promise<Style> => {
    const res = await apiClient.patch<Style>(`/styles/${id}`, payload);
    return res.data;
  },

  deleteStyle: async (id: string): Promise<void> => {
    await apiClient.delete(`/styles/${id}`);
  },
};
