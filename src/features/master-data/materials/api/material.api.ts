import apiClient from "@/lib/apiClient";
import { materialListSchema, materialSchema } from "../schemas/material.schema";
import type {
  Material,
  MaterialInput,
  MaterialListFilters,
  MaterialStatus,
} from "../types/material.types";

const resource = "/masters/materials";

export const materialApi = {
  async list(filters: MaterialListFilters = {}): Promise<Material[]> {
    const response = await apiClient.get<Material[]>(resource, { params: filters });
    return materialListSchema.parse(response.data);
  },
  async create(input: MaterialInput): Promise<Material> {
    const response = await apiClient.post<Material>(resource, input);
    return materialSchema.parse(response.data);
  },
  async update(id: string, input: Partial<MaterialInput>): Promise<Material> {
    const response = await apiClient.patch<Material>(`${resource}/${id}`, input);
    return materialSchema.parse(response.data);
  },
  async updateStatus(id: string, status: MaterialStatus): Promise<Material> {
    const response = await apiClient.patch<Material>(`${resource}/${id}/status`, { status });
    return materialSchema.parse(response.data);
  },
};
