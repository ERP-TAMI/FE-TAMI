import apiClient from "@/lib/apiClient";
import type { MaterialStatus, Unit, UnitListResponse, UnitQuery } from "@/types/material";
import { unitListResponseSchema, unitResponseSchema } from "./material.schema";

const resource = "/masters/units";

export type UnitInput = {
  name: string;
};

function queryParams(query: UnitQuery) {
  const search = query.search?.trim();
  const params = {
    ...(search ? { search } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.page ? { page: query.page } : {}),
    ...(query.limit ? { limit: query.limit } : {}),
  };
  return Object.keys(params).length > 0 ? params : undefined;
}

export const unitApi = {
  async list(query: UnitQuery = {}): Promise<UnitListResponse> {
    const response = await apiClient.get<UnitListResponse>(resource, {
      params: queryParams(query),
    });
    return unitListResponseSchema.parse(response.data);
  },
  async create(input: UnitInput): Promise<Unit> {
    const response = await apiClient.post<Unit>(resource, input);
    return unitResponseSchema.parse(response.data);
  },
  async update(id: string, input: Partial<UnitInput>): Promise<Unit> {
    const response = await apiClient.patch<Unit>(`${resource}/${id}`, input);
    return unitResponseSchema.parse(response.data);
  },
  async updateStatus(id: string, status: MaterialStatus): Promise<Unit> {
    const response = await apiClient.patch<Unit>(`${resource}/${id}/status`, { status });
    return unitResponseSchema.parse(response.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${resource}/${id}`);
  },
};
