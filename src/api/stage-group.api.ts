import apiClient from "@/lib/apiClient";
import type {
  StageGroup,
  StageGroupInput,
  StageGroupListParams,
  StageGroupStatus,
  StageGroupSummary,
  StageGroupUpdateInput,
} from "@/types/stage-group";
import { stageGroupListSchema, stageGroupResponseSchema } from "./stage-group.schema";

const resource = "/masters/stage-groups";

export const stageGroupApi = {
  async list(params?: StageGroupListParams): Promise<StageGroupSummary[]> {
    const response = await apiClient.get<StageGroupSummary[]>(resource, { params });
    return stageGroupListSchema.parse(response.data);
  },
  async detail(id: string): Promise<StageGroup> {
    const response = await apiClient.get<StageGroup>(`${resource}/${id}`);
    return stageGroupResponseSchema.parse(response.data);
  },
  async create(input: StageGroupInput): Promise<StageGroup> {
    const response = await apiClient.post<StageGroup>(resource, input);
    return stageGroupResponseSchema.parse(response.data);
  },
  async update(id: string, input: StageGroupUpdateInput): Promise<StageGroup> {
    const response = await apiClient.patch<StageGroup>(`${resource}/${id}`, input);
    return stageGroupResponseSchema.parse(response.data);
  },
  async updateStatus(id: string, status: StageGroupStatus): Promise<StageGroup> {
    const response = await apiClient.patch<StageGroup>(`${resource}/${id}/status`, { status });
    return stageGroupResponseSchema.parse(response.data);
  },
};
