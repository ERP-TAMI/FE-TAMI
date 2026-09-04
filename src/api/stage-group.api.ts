import apiClient from "@/lib/apiClient";
import type {
  StageGroup as MasterStageGroup,
  StageGroupInput,
  StageGroupListParams,
  StageGroupStatus,
  StageGroupSummary,
  StageGroupUpdateInput,
} from "@/types/stage-group";
import { stageGroupListSchema, stageGroupResponseSchema } from "./stage-group.schema";

const resource = "/masters/stage-groups";

export interface StageGroupSubItem {
  id: string;
  name: string;
  description?: string;
  ssv: number;
  orderIndex: number;
}

export interface StageGroup {
  id: string;
  code: string;
  name: string;
  description?: string;
  isGroup: boolean;
  items: StageGroupSubItem[];
}

export const stageGroupApi = {
  async list(params?: StageGroupListParams): Promise<StageGroupSummary[]> {
    const response = await apiClient.get<StageGroupSummary[]>(resource, { params });
    return stageGroupListSchema.parse(response.data);
  },
  async detail(id: string): Promise<MasterStageGroup> {
    const response = await apiClient.get<MasterStageGroup>(`${resource}/${id}`);
    return stageGroupResponseSchema.parse(response.data);
  },
  async create(input: StageGroupInput): Promise<MasterStageGroup> {
    const response = await apiClient.post<MasterStageGroup>(resource, input);
    return stageGroupResponseSchema.parse(response.data);
  },
  async update(id: string, input: StageGroupUpdateInput): Promise<MasterStageGroup> {
    const response = await apiClient.patch<MasterStageGroup>(`${resource}/${id}`, input);
    return stageGroupResponseSchema.parse(response.data);
  },
  async updateStatus(id: string, status: StageGroupStatus): Promise<MasterStageGroup> {
    const response = await apiClient.patch<MasterStageGroup>(`${resource}/${id}/status`, { status });
    return stageGroupResponseSchema.parse(response.data);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${resource}/${id}`);
  },

  getStageGroups: async (): Promise<StageGroup[]> => {
    const res = await apiClient.get<Record<string, unknown>[]>(resource);
    return (res.data || []).map((g: Record<string, unknown>) => ({
      id: String(g.id || ""),
      code: String(g.groupCode || g.code || ""),
      name: String(g.groupName || g.name || ""),
      description: g.description ? String(g.description) : undefined,
      isGroup: true,
      items: (Array.isArray(g.items) ? g.items : []).map(
        (it: Record<string, unknown>) => ({
          id: String(it.id || ""),
          name: String(it.itemName || it.name || ""),
          description: it.description ? String(it.description) : undefined,
          ssv: Number(it.ssv) || 0,
          orderIndex: Number(it.orderIndex) || 0,
        }),
      ),
    }));
  },

  getStageGroupById: async (id: string): Promise<StageGroup> => {
    const res = await apiClient.get<Record<string, unknown>>(`${resource}/${id}`);
    const g = res.data || {};
    return {
      id: String(g.id || ""),
      code: String(g.groupCode || g.code || ""),
      name: String(g.groupName || g.name || ""),
      description: g.description ? String(g.description) : undefined,
      isGroup: true,
      items: (Array.isArray(g.items) ? g.items : []).map(
        (it: Record<string, unknown>) => ({
          id: String(it.id || ""),
          name: String(it.itemName || it.name || ""),
          description: it.description ? String(it.description) : undefined,
          ssv: Number(it.ssv) || 0,
          orderIndex: Number(it.orderIndex) || 0,
        }),
      ),
    };
  },
};
