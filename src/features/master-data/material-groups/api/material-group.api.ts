import apiClient from "@/lib/apiClient";
import {
  materialGroupListSchema,
  materialGroupResponseSchema,
} from "../schemas/material-group.schema";
import type {
  MaterialGroup,
  MaterialGroupInput,
  MaterialGroupStatus,
} from "../types/material-group.types";

const resource = "/masters/material-groups";

export const materialGroupApi = {
  async list(status?: MaterialGroupStatus): Promise<MaterialGroup[]> {
    const response = await apiClient.get<MaterialGroup[]>(resource, {
      params: status ? { status } : undefined,
    });
    return materialGroupListSchema.parse(response.data);
  },
  async create(input: MaterialGroupInput): Promise<MaterialGroup> {
    const response = await apiClient.post<MaterialGroup>(resource, input);
    return materialGroupResponseSchema.parse(response.data);
  },
  async get(id: string): Promise<MaterialGroup> {
    const response = await apiClient.get<MaterialGroup>(`${resource}/${id}`);
    return materialGroupResponseSchema.parse(response.data);
  },
  async update(id: string, input: Partial<MaterialGroupInput>): Promise<MaterialGroup> {
    const response = await apiClient.patch<MaterialGroup>(`${resource}/${id}`, input);
    return materialGroupResponseSchema.parse(response.data);
  },
  async updateStatus(id: string, status: MaterialGroupStatus): Promise<MaterialGroup> {
    const response = await apiClient.patch<MaterialGroup>(`${resource}/${id}/status`, { status });
    return materialGroupResponseSchema.parse(response.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${resource}/${id}`);
  },
};
