import { useQuery } from "@tanstack/react-query";
import {
  auditApi,
  type QueryEntityHistoryParams,
  type QueryHttpAuditLogsParams,
} from "@/api/audit.api";

export const entityHistoryKeys = {
  all: ["entity-history"] as const,
  list: (params: QueryEntityHistoryParams) =>
    [...entityHistoryKeys.all, params] as const,
};

export function useEntityHistory(
  params: QueryEntityHistoryParams,
  options?: { enabled?: boolean },
) {
  const hasScope = Boolean(params.aggregateId || params.parentId);
  return useQuery({
    queryKey: entityHistoryKeys.list(params),
    queryFn: () => auditApi.getEntityHistory(params),
    enabled: hasScope && (options?.enabled ?? true),
  });
}

export const httpAuditLogKeys = {
  all: ["http-audit-logs"] as const,
  list: (params: QueryHttpAuditLogsParams) =>
    [...httpAuditLogKeys.all, params] as const,
};

export function useHttpAuditLogs(params: QueryHttpAuditLogsParams) {
  return useQuery({
    queryKey: httpAuditLogKeys.list(params),
    queryFn: () => auditApi.getHttpAuditLogs(params),
  });
}
