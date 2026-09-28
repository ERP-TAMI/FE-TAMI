import apiClient from "@/lib/apiClient";
import type {
  CreateWorkshopInput,
  UpdateWorkshopInput,
  Workshop,
  WorkshopListResponse,
  WorkshopQuery,
  WorkshopStatus,
} from "@/types/workshop";
import { workshopListResponseSchema, workshopResponseSchema } from "./workshop.schema";

const resource = "/masters/workshops";

function queryParams(query: WorkshopQuery) {
  const search = query.search?.trim();
  const params = {
    ...(search ? { search } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.page ? { page: query.page } : {}),
    ...(query.limit ? { limit: query.limit } : {}),
  };
  return Object.keys(params).length > 0 ? params : undefined;
}

export const workshopApi = {
  async list(query: WorkshopQuery = {}): Promise<WorkshopListResponse> {
    const response = await apiClient.get<WorkshopListResponse>(resource, {
      params: queryParams(query),
    });
    return workshopListResponseSchema.parse(response.data);
  },
  async detail(id: string): Promise<Workshop> {
    const response = await apiClient.get<Workshop>(`${resource}/${id}`);
    return workshopResponseSchema.parse(response.data);
  },
  async create(input: CreateWorkshopInput): Promise<Workshop> {
    const response = await apiClient.post<Workshop>(resource, input);
    return workshopResponseSchema.parse(response.data);
  },
  async update(id: string, input: UpdateWorkshopInput): Promise<Workshop> {
    const response = await apiClient.patch<Workshop>(`${resource}/${id}`, input);
    return workshopResponseSchema.parse(response.data);
  },
  async updateStatus(id: string, status: WorkshopStatus): Promise<Workshop> {
    const response = await apiClient.patch<Workshop>(`${resource}/${id}/status`, { status });
    return workshopResponseSchema.parse(response.data);
  },
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${resource}/${id}`);
  },
};
