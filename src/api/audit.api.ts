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
}

export interface PaginatedHttpAuditLogs {
  items: HttpAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryHttpAuditLogsParams {
  method?: string;
  path?: string;
  actorUserId?: string;
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
