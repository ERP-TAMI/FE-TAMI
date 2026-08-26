import apiClient from "@/lib/apiClient";
import type {
  CreateWorkshopInput,
  UpdateWorkshopInput,
  Workshop,
  WorkshopQuery,
  WorkshopStatus,
} from "@/types/workshop";
import { workshopListSchema, workshopResponseSchema } from "./workshop.schema";

const resource = "/masters/workshops";

function queryParams(query: WorkshopQuery) {
  const search = query.search?.trim();
  const params = {
    ...(search ? { search } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  return Object.keys(params).length > 0 ? params : undefined;
}

export const workshopApi = {
  async list(query: WorkshopQuery = {}): Promise<Workshop[]> {
    const response = await apiClient.get<Workshop[]>(resource, {
      params: queryParams(query),
    });
    return workshopListSchema.parse(response.data);
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
};
