import apiClient from "@/lib/apiClient";
import type {
  Stage,
  StageInput,
  StageListParams,
  StageListResponse,
  StageSsvBulkInput,
  StageStatus,
  StageUpdateInput,
} from "@/types/stage";
import { stageListResponseSchema, stageListSchema, stageResponseSchema } from "./stage.schema";

const resource = "/masters/stages";

export const stageApi = {
  async list(params?: StageListParams): Promise<StageListResponse> {
    const response = await apiClient.get<StageListResponse>(resource, { params });
    return stageListResponseSchema.parse(response.data);
  },
  async detail(id: string): Promise<Stage> {
    const response = await apiClient.get<Stage>(`${resource}/${id}`);
    return stageResponseSchema.parse(response.data);
  },
  async create(input: StageInput): Promise<Stage> {
    const response = await apiClient.post<Stage>(resource, input);
    return stageResponseSchema.parse(response.data);
  },
  async update(id: string, input: StageUpdateInput): Promise<Stage> {
    const response = await apiClient.patch<Stage>(`${resource}/${id}`, input);
    return stageResponseSchema.parse(response.data);
  },
  async updateStatus(id: string, status: StageStatus): Promise<Stage> {
    const response = await apiClient.patch<Stage>(`${resource}/${id}/status`, { status });
    return stageResponseSchema.parse(response.data);
  },
  async updateSsvBulk(input: StageSsvBulkInput): Promise<Stage[]> {
    const response = await apiClient.patch<Stage[]>(`${resource}/bulk-ssv`, input);
    return stageListSchema.parse(response.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${resource}/${id}`);
  },
};
