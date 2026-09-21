import apiClient from "@/lib/apiClient";
import type {
  BomDetail,
  BomStats,
  QueryBomsParams,
  QueryBomStatsParams,
  CreateBomPayload,
  PaginatedBomsResponse,
} from "@/types/bom";

export const bomsApi = {
  async getBoms(params: QueryBomsParams = {}): Promise<PaginatedBomsResponse> {
    const cleanParams: Record<string, string | number> = {};
    if (params.type) cleanParams.type = params.type;
    if (params.status) cleanParams.status = params.status;
    if (params.search?.trim()) cleanParams.search = params.search.trim();
    if (params.bomCode?.trim()) cleanParams.bomCode = params.bomCode.trim();
    if (params.style?.trim()) cleanParams.style = params.style.trim();
    if (params.purchaseOrder?.trim()) cleanParams.purchaseOrder = params.purchaseOrder.trim();
    if (params.product?.trim()) cleanParams.product = params.product.trim();
    if (params.page !== undefined && params.page !== null) cleanParams.page = params.page;
    if (params.limit !== undefined && params.limit !== null) cleanParams.limit = params.limit;
    if (params.sortBy) cleanParams.sortBy = params.sortBy;
    if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;

    const res = await apiClient.get<PaginatedBomsResponse>("/boms", {
      params: cleanParams,
    });
    return res.data;
  },

  async getBomStats(params: QueryBomStatsParams = {}): Promise<BomStats> {
    const cleanParams: Record<string, string> = {};
    if (params.month) cleanParams.month = params.month;
    if (params.year) cleanParams.year = String(params.year);
    if (params.startDate) cleanParams.startDate = params.startDate;
    if (params.endDate) cleanParams.endDate = params.endDate;
    if (params.type) cleanParams.type = params.type;

    const res = await apiClient.get<BomStats>("/boms/stats", {
      params: cleanParams,
    });
    return res.data;
  },

  async getBomById(id: string): Promise<BomDetail> {
    const res = await apiClient.get<BomDetail>(`/boms/${id}`);
    return res.data;
  },

  async createBom(payload: CreateBomPayload): Promise<BomDetail> {
    const cleanBody: Record<string, unknown> = {
      type: payload.type,
    };
    if (payload.type === "fit" && payload.styleId) cleanBody.styleId = payload.styleId;
    if (payload.type === "po" && payload.purchaseOrderProductId) cleanBody.purchaseOrderProductId = payload.purchaseOrderProductId;
    if (payload.deadline) cleanBody.deadline = payload.deadline;
    if (payload.rdNote) cleanBody.rdNote = payload.rdNote;

    const res = await apiClient.post<BomDetail>("/boms", cleanBody);
    return res.data;
  },

  async updateBom(id: string, payload: import("@/types/bom").UpdateBomPayload): Promise<BomDetail> {
    const cleanBody: Record<string, unknown> = {};
    if (payload.deadline !== undefined) cleanBody.deadline = payload.deadline;
    if (payload.rdNote !== undefined) cleanBody.rdNote = payload.rdNote;

    const res = await apiClient.patch<BomDetail>(`/boms/${id}`, cleanBody);
    return res.data;
  },

  async discontinueBom(id: string, payload: import("@/types/bom").DiscontinueBomPayload): Promise<BomDetail> {
    const cleanBody = {
      reason: payload.reason?.trim() || "",
    };
    const res = await apiClient.post<BomDetail>(`/boms/${id}/discontinue`, cleanBody);
    return res.data;
  },

  async addLine(id: string, payload: import("@/types/bom").CreateBomLinePayload): Promise<import("@/types/bom").BomLineItem> {
    const cleanBody: Record<string, unknown> = {
      materialId: payload.materialId,
      consumption: payload.consumption !== undefined ? Number(payload.consumption) : 0,
    };
    if (payload.note !== undefined && payload.note !== null) {
      cleanBody.note = payload.note;
    }
    if (payload.orderIndex !== undefined && payload.orderIndex !== null) {
      cleanBody.orderIndex = Number(payload.orderIndex);
    }
    const res = await apiClient.post<import("@/types/bom").BomLineItem>(`/boms/${id}/lines`, cleanBody);
    return res.data;
  },

  async updateLine(id: string, lineId: string, payload: import("@/types/bom").UpdateBomLinePayload): Promise<import("@/types/bom").BomLineItem> {
    const cleanBody: Record<string, unknown> = {};
    if (payload.materialId !== undefined) cleanBody.materialId = payload.materialId;
    if (payload.consumption !== undefined) cleanBody.consumption = Number(payload.consumption);
    if (payload.unitCost !== undefined) cleanBody.unitCost = payload.unitCost;
    if (payload.note !== undefined) cleanBody.note = payload.note;
    if (payload.orderIndex !== undefined) cleanBody.orderIndex = Number(payload.orderIndex);

    const res = await apiClient.patch<import("@/types/bom").BomLineItem>(`/boms/${id}/lines/${lineId}`, cleanBody);
    return res.data;
  },

  async deleteLine(id: string, lineId: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/boms/${id}/lines/${lineId}`);
    return res.data;
  },

  async reorderLines(id: string, payload: import("@/types/bom").ReorderBomLinesPayload): Promise<import("@/types/bom").BomLineItem[]> {
    const cleanBody = {
      lineIds: Array.isArray(payload.lineIds) ? payload.lineIds : [],
    };
    const res = await apiClient.put<import("@/types/bom").BomLineItem[]>(`/boms/${id}/lines/reorder`, cleanBody);
    return res.data;
  },

  async forwardBom(id: string, payload?: import("@/types/bom").ForwardBomPayload): Promise<BomDetail> {
    const text = (payload?.reason || payload?.note)?.trim();
    const body = text ? { reason: text } : {};
    const res = await apiClient.post<BomDetail>(`/boms/${id}/forward`, body);
    return res.data;
  },

  async rejectBom(id: string, payload: import("@/types/bom").RejectBomPayload): Promise<BomDetail> {
    const cleanBody = {
      targetStatus: payload.targetStatus,
      reason: payload.reason?.trim() || "",
    };
    const res = await apiClient.post<BomDetail>(`/boms/${id}/reject`, cleanBody);
    return res.data;
  },

  async approveBom(id: string, payload?: import("@/types/bom").ApproveBomPayload): Promise<BomDetail> {
    const text = ((payload as Record<string, unknown>)?.reason as string | undefined || payload?.note)?.trim();
    const body = text ? { reason: text } : {};
    const res = await apiClient.post<BomDetail>(`/boms/${id}/approve`, body);
    return res.data;
  },

  async createRevision(id: string, payload: import("@/types/bom").CreateRevisionPayload): Promise<BomDetail> {
    const text = (payload?.reason || (payload as Record<string, unknown>)?.changeReason as string | undefined)?.trim() || "";
    const res = await apiClient.post<BomDetail>(`/boms/${id}/revisions`, { reason: text });
    return res.data;
  },

  async getRevisions(id: string): Promise<import("@/types/bom").RevisionListItem[]> {
    const res = await apiClient.get<import("@/types/bom").RevisionListItem[]>(`/boms/${id}/revisions`);
    return res.data;
  },

  async getRevisionDetail(id: string, revisionId: string): Promise<import("@/types/bom").RevisionDetail> {
    const res = await apiClient.get<import("@/types/bom").RevisionDetail>(`/boms/${id}/revisions/${revisionId}`);
    return res.data;
  },

  async getRevisionHistory(id: string, revisionId: string): Promise<import("@/types/bom").BomWorkflowHistoryItem[]> {
    const res = await apiClient.get<Record<string, unknown>[]>(`/boms/${id}/revisions/${revisionId}/history`);
    return (res.data || []).map((item) => ({
      ...item,
      id: String(item.id || ""),
      revisionId: String(item.revisionId || revisionId),
      oldStatus: (item.oldStatus !== undefined ? item.oldStatus : (item.fromStatus ?? null)) as import("@/types/bom").BomStatus | null,
      newStatus: (item.newStatus ?? item.toStatus) as import("@/types/bom").BomStatus,
      fromStatus: (item.fromStatus ?? item.oldStatus ?? item.newStatus) as import("@/types/bom").BomStatus,
      toStatus: (item.toStatus ?? item.newStatus) as import("@/types/bom").BomStatus,
      action: item.action as string | undefined,
      reason: item.reason as string | null | undefined,
      changedBy: item.changedBy as string | null | undefined,
      changedAt: (item.changedAt ?? item.createdAt) as string | Date,
      createdAt: (item.createdAt ?? item.changedAt) as string | Date,
    }));
  },

  async getRevisionDiff(
    id: string,
    revisionId: string,
    compareWithRevisionId?: string
  ): Promise<import("@/types/bom").RevisionDiffResponse> {
    const res = await apiClient.get<Record<string, unknown>>(
      `/boms/${id}/revisions/${revisionId}/diff`,
      {
        params: compareWithRevisionId ? { compareWithRevisionId } : undefined,
      }
    );
    const data = res.data || {};
    const rawItems = (Array.isArray(data.items) ? data.items : []) as Record<string, unknown>[];
    const items = rawItems.map((item) => ({
      ...item,
      materialId: String(item.materialId || ""),
      materialNameSnapshot: String(item.materialNameSnapshot || ""),
      materialGroupSnapshot: item.materialGroupSnapshot as string | null | undefined,
      unitSnapshot: String(item.unitSnapshot || ""),
      diffType: (item.diffType || "UNCHANGED") as import("@/types/bom").RevisionDiffType,
      oldLine: (item.oldLine !== undefined ? item.oldLine : (item.source ?? null)) as import("@/types/bom").RevisionDiffLineSnapshot | null | undefined,
      newLine: (item.newLine !== undefined ? item.newLine : (item.target ?? null)) as import("@/types/bom").RevisionDiffLineSnapshot | null | undefined,
      source: (item.source !== undefined ? item.source : (item.oldLine ?? null)) as import("@/types/bom").RevisionDiffLineSnapshot | null | undefined,
      target: (item.target !== undefined ? item.target : (item.newLine ?? null)) as import("@/types/bom").RevisionDiffLineSnapshot | null | undefined,
    }));
    return {
      ...(data as unknown as import("@/types/bom").RevisionDiffResponse),
      items,
    };
  },

  async copyFromFit(id: string, payload?: import("@/types/bom").CopyFitToPoPayload): Promise<BomDetail> {
    const cleanBody: Record<string, unknown> = {};
    if (payload?.sourceRevisionId) {
      cleanBody.sourceRevisionId = payload.sourceRevisionId;
    }
    const res = await apiClient.post<BomDetail>(`/boms/${id}/copy-from-fit`, cleanBody);
    return res.data;
  },

  async getBomAggregate(
    idOrParams?: string | import("@/types/bom").BomAggregateParams,
    extraParams?: Record<string, unknown>
  ): Promise<import("@/types/bom").BomAggregateResponse> {
    const rawParams: Record<string, unknown> = {};
    if (typeof idOrParams === "string") {
      rawParams.bomId = idOrParams;
      if (extraParams) Object.assign(rawParams, extraParams);
    } else if (idOrParams && typeof idOrParams === "object") {
      Object.assign(rawParams, idOrParams);
      if (extraParams) Object.assign(rawParams, extraParams);
    }

    const cleanParams: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawParams)) {
      if (value !== undefined && value !== null && value !== "" && value !== "all") {
        cleanParams[key] = value;
      }
    }

    const res = await apiClient.get<
      import("@/types/bom").BomAggregateResponse | import("@/types/bom").BomAggregateItem[]
    >("/boms/aggregate", {
      params: cleanParams,
    });

    if (Array.isArray(res.data)) {
      return {
        data: res.data,
        meta: {
          total: res.data.length,
          page: 1,
          limit: res.data.length || 20,
          totalPages: 1,
        },
      };
    }

    const dataArr = Array.isArray(res.data?.data) ? res.data.data : [];
    const metaObj = res.data?.meta || {
      total: dataArr.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    return {
      data: dataArr,
      meta: metaObj,
    };
  },
};
