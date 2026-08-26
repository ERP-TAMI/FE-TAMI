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
    const res = await apiClient.get<any[]>("/masters/stage-groups");
    return (res.data || []).map((g: any) => ({
      id: g.id,
      code: g.groupCode || g.code || "",
      name: g.groupName || g.name || "",
      description: g.description || undefined,
      isGroup: true,
      items: (g.items || []).map((it: any) => ({
        id: it.id,
        name: it.itemName || it.name || "",
        description: it.description || undefined,
        ssv: Number(it.ssv) || 0,
        orderIndex: it.orderIndex || 0,
      })),
    }));
  },

  getStageGroupById: async (id: string): Promise<StageGroup> => {
    const res = await apiClient.get<any>(`/masters/stage-groups/${id}`);
    const g = res.data;
    return {
      id: g.id,
      code: g.groupCode || g.code || "",
      name: g.groupName || g.name || "",
      description: g.description || undefined,
      isGroup: true,
      items: (g.items || []).map((it: any) => ({
        id: it.id,
        name: it.itemName || it.name || "",
        description: it.description || undefined,
        ssv: Number(it.ssv) || 0,
        orderIndex: it.orderIndex || 0,
      })),
    };
  },
};
