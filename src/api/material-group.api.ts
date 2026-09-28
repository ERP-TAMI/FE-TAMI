import apiClient from "@/lib/apiClient";
import type {
  MaterialGroup,
  MaterialGroupInput,
  MaterialGroupListResponse,
  MaterialGroupQuery,
  MaterialGroupStatus,
} from "@/types/material-group";
import { materialGroupListResponseSchema, materialGroupResponseSchema } from "./material-group.schema";

const resource = "/masters/material-groups";

function queryParams(query: MaterialGroupQuery) {
  const search = query.search?.trim();
  const params = {
    ...(search ? { search } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.page ? { page: query.page } : {}),
    ...(query.limit ? { limit: query.limit } : {}),
  };
  return Object.keys(params).length > 0 ? params : undefined;
}

export const materialGroupApi = {
  async list(query: MaterialGroupQuery = {}): Promise<MaterialGroupListResponse> {
    const response = await apiClient.get<MaterialGroupListResponse>(resource, {
      params: queryParams(query),
    });
    return materialGroupListResponseSchema.parse(response.data);
  },
  async create(input: MaterialGroupInput): Promise<MaterialGroup> {
    const response = await apiClient.post<MaterialGroup>(resource, input);
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
