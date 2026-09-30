import apiClient from "@/lib/apiClient";

export type AuditEventType =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "approved"
  | "rejected"
  | "document_linked"
  | "document_unlinked"
  | "document_version_added"
  | "copied"
  | "synced"
  | "login"
  | "password_changed"
  | "role_changed";

export interface EntityHistoryChange {
  fieldName: string;
  fieldLabel: string;
  /** Chỉ có ở các entry đến từ 1 lần lưu hàng loạt — tên dòng (VD "Cắt vải")
   * mà field này thuộc về, dùng để nhóm hiển thị theo dòng. */
  groupLabel?: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface EntityHistoryEvent {
  id: string;
  occurredAt: string;
  eventType: AuditEventType;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  targetLabel: string | null;
  reason: string | null;
  changes: EntityHistoryChange[];
}

export interface PaginatedEntityHistory {
  items: EntityHistoryEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryEntityHistoryParams {
  aggregateType: string;
  aggregateId?: string;
  parentId?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface HttpAuditLog {
  id: string;
  occurredAt: string;
  method: string;
  path: string;
  statusCode: number | null;
  durationMs: number | null;
  actorUserId: string | null;
  actorIdentifier: string | null;
  actorRole: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  queryParams: Record<string, unknown> | null;
  requestBody: Record<string, unknown> | null;
  errorMessage: string | null;
  /** Hành động đã phân loại ở backend (login, update, delete, upload...). */
  action: string | null;
  actionLabel: string | null;
  resourceType: string | null;
  resourceLabel: string | null;
  resourceId: string | null;
  /** Tên đối tượng bị tác động, VD tên công đoạn hoặc tên tệp vừa tải lên. */
  targetName: string | null;
  /** Đối tượng cha ngoài cùng, VD Mẫu Fit chứa công đoạn đó. */
  contextLabel: string | null;
  contextName: string | null;
}

export interface PaginatedHttpAuditLogs {
  items: HttpAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryHttpAuditLogsParams {
  action?: string;
  method?: string;
  path?: string;
  actorUserId?: string;
  actorIdentifier?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  getEntityHistory: async (
    params: QueryEntityHistoryParams,
  ): Promise<PaginatedEntityHistory> => {
    const res = await apiClient.get<PaginatedEntityHistory>("/audit/history", {
      params,
    });
    return res.data;
  },

  getHttpAuditLogs: async (
    params: QueryHttpAuditLogsParams,
  ): Promise<PaginatedHttpAuditLogs> => {
    const res = await apiClient.get<PaginatedHttpAuditLogs>("/audit", {
      params,
    });
    return res.data;
  },
};
