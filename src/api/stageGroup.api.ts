import apiClient from "@/lib/apiClient";

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
  getStageGroups: async (): Promise<StageGroup[]> => {
    const res = await apiClient.get<StageGroup[]>("/masters/stage-groups");
    return res.data;
  },

  getStageGroupById: async (id: string): Promise<StageGroup> => {
    const res = await apiClient.get<StageGroup>(`/masters/stage-groups/${id}`);
    return res.data;
  },
};
