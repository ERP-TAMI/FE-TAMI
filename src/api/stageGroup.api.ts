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
    const res = await apiClient.get<Record<string, unknown>[]>(
      "/masters/stage-groups",
    );
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
    const res = await apiClient.get<Record<string, unknown>>(
      `/masters/stage-groups/${id}`,
    );
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
