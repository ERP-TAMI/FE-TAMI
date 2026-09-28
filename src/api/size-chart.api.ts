import apiClient from "@/lib/apiClient";
import type {
  CreateSizeChartInput,
  SizeChart,
  SizeChartListResponse,
  SizeChartQuery,
  SizeChartStatus,
  UpdateSizeChartInput,
} from "@/types/size-chart";
import { sizeChartListResponseSchema, sizeChartResponseSchema } from "./size-chart.schema";

const resource = "/masters/size-charts";

function queryParams(query: SizeChartQuery) {
  const search = query.search?.trim();
  const params = {
    ...(search ? { search } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.page ? { page: query.page } : {}),
    ...(query.limit ? { limit: query.limit } : {}),
  };
  return Object.keys(params).length > 0 ? params : undefined;
}

export const sizeChartApi = {
  async list(query: SizeChartQuery = {}): Promise<SizeChartListResponse> {
    const response = await apiClient.get<SizeChartListResponse>(resource, {
      params: queryParams(query),
    });
    return sizeChartListResponseSchema.parse(response.data);
  },
  async detail(id: string): Promise<SizeChart> {
    const response = await apiClient.get<SizeChart>(`${resource}/${id}`);
    return sizeChartResponseSchema.parse(response.data);
  },
  async create(input: CreateSizeChartInput): Promise<SizeChart> {
    const response = await apiClient.post<SizeChart>(resource, input);
    return sizeChartResponseSchema.parse(response.data);
  },
  async update(id: string, input: UpdateSizeChartInput): Promise<SizeChart> {
    const response = await apiClient.patch<SizeChart>(`${resource}/${id}`, input);
    return sizeChartResponseSchema.parse(response.data);
  },
  async updateStatus(id: string, status: SizeChartStatus): Promise<SizeChart> {
    const response = await apiClient.patch<SizeChart>(`${resource}/${id}/status`, { status });
    return sizeChartResponseSchema.parse(response.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${resource}/${id}`);
  },
};
