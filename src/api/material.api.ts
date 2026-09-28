import apiClient from "@/lib/apiClient";
import type {
  Material,
  MaterialFilters,
  MaterialListResponse,
  MaterialInput,
  MaterialStatus,
  MaterialUpdateInput,
} from "@/types/material";
import { materialListResponseSchema, materialResponseSchema } from "./material.schema";

const resource = "/masters/materials";

export const materialApi = {
  async list(filters: MaterialFilters = {}): Promise<MaterialListResponse> {
    const response = await apiClient.get<MaterialListResponse>(resource, { params: filters });
    return materialListResponseSchema.parse(response.data);
  },
  async detail(id: string): Promise<Material> {
    const response = await apiClient.get<Material>(`${resource}/${id}`);
    return materialResponseSchema.parse(response.data);
  },
  async create(input: MaterialInput): Promise<Material> {
    const response = await apiClient.post<Material>(resource, input);
    return materialResponseSchema.parse(response.data);
  },
  async update(id: string, input: MaterialUpdateInput): Promise<Material> {
    const response = await apiClient.patch<Material>(`${resource}/${id}`, input);
    return materialResponseSchema.parse(response.data);
  },
  async updateStatus(id: string, status: MaterialStatus): Promise<Material> {
    const response = await apiClient.patch<Material>(`${resource}/${id}/status`, { status });
    return materialResponseSchema.parse(response.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${resource}/${id}`);
  },
};
