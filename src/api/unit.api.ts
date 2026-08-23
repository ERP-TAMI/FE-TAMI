import apiClient from "@/lib/apiClient";
import type { MaterialStatus, Unit } from "@/types/material";
import { unitListSchema, unitResponseSchema } from "./material.schema";

const resource = "/masters/units";

export type UnitInput = {
  name: string;
};

export const unitApi = {
  async list(status?: MaterialStatus): Promise<Unit[]> {
    const response = await apiClient.get<Unit[]>(resource, {
      params: status ? { status } : undefined,
    });
    return unitListSchema.parse(response.data);
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
