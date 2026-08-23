import apiClient from "@/lib/apiClient";
import type {
  Stage,
  StageInput,
  StageListParams,
  StageSsvBulkInput,
  StageStatus,
  StageUpdateInput,
} from "@/types/stage";
import { stageListSchema, stageResponseSchema } from "./stage.schema";

const resource = "/masters/stages";

export const stageApi = {
  async list(params?: StageListParams): Promise<Stage[]> {
    const response = await apiClient.get<Stage[]>(resource, { params });
    return stageListSchema.parse(response.data);
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
};
