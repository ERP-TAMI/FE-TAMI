import apiClient from "@/lib/apiClient";

export interface StyleOperationStepItem {
  id: string;
  styleId?: string;
  parentStepId?: string | null;
  stageId?: string | null;
  stepName: string;
  description?: string | null;
  timePerPiece: number;
  ssv: number;
  targetTotal?: number;
  note?: string | null;
  orderIndex: number;
  isGroup: boolean;
  groupId?: string | null;
  groupItems?: any;
}

export interface BulkSaveStyleOperationStepsPayload {
  steps: Partial<StyleOperationStepItem>[];
  as3bCmBaseDays?: number;
}

export const styleOperationStepsApi = {
  getSteps: async (styleId: string): Promise<StyleOperationStepItem[]> => {
    const res = await apiClient.get<StyleOperationStepItem[]>(
      `/styles/${styleId}/operation-steps`,
    );
    return res.data;
  },

  createStep: async (
    styleId: string,
    payload: Partial<StyleOperationStepItem>,
  ): Promise<StyleOperationStepItem> => {
    const res = await apiClient.post<StyleOperationStepItem>(
      `/styles/${styleId}/operation-steps`,
      payload,
    );
    return res.data;
  },

  bulkSaveSteps: async (
    styleId: string,
    payload: BulkSaveStyleOperationStepsPayload | Partial<StyleOperationStepItem>[],
  ): Promise<StyleOperationStepItem[]> => {
    const res = await apiClient.put<StyleOperationStepItem[]>(
      `/styles/${styleId}/operation-steps`,
      payload,
    );
    return res.data;
  },

  updateStep: async (
    styleId: string,
    stepId: string,
    payload: Partial<StyleOperationStepItem>,
  ): Promise<StyleOperationStepItem> => {
    const res = await apiClient.patch<StyleOperationStepItem>(
      `/styles/${styleId}/operation-steps/${stepId}`,
      payload,
    );
    return res.data;
  },

  deleteStep: async (styleId: string, stepId: string): Promise<void> => {
    await apiClient.delete(`/styles/${styleId}/operation-steps/${stepId}`);
  },

  reorderSteps: async (
    styleId: string,
    orderedIds: string[],
  ): Promise<StyleOperationStepItem[]> => {
    const res = await apiClient.put<StyleOperationStepItem[]>(
      `/styles/${styleId}/operation-steps/reorder`,
      { orderedIds },
    );
    return res.data;
  },

  exportExcel: async (styleId: string): Promise<Blob> => {
    const res = await apiClient.get<Blob>(
      `/styles/${styleId}/operation-steps/export`,
      { responseType: "blob" },
    );
    return res.data;
  },
};
