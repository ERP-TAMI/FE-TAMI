import { useQuery } from "@tanstack/react-query";
import { auditApi, type QueryHttpAuditLogsParams } from "@/api/audit.api";

export const entityHistoryKeys = {
  all: ["entity-history"] as const,
  byEntity: (aggregateType: string, aggregateId: string) =>
    [...entityHistoryKeys.all, aggregateType, aggregateId] as const,
};

export function useEntityHistory(
  aggregateType: string,
  aggregateId?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: entityHistoryKeys.byEntity(aggregateType, aggregateId ?? ""),
    queryFn: () => auditApi.getEntityHistory(aggregateType, aggregateId as string),
    enabled: Boolean(aggregateId) && (options?.enabled ?? true),
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
