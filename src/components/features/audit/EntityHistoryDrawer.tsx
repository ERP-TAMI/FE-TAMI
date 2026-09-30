import { useState } from "react";
import { Modal } from "@/components/shared/Modal";
import { useEntityHistory } from "@/hooks/useEntityHistory";
import { EntityEventBadge } from "./EntityEventBadge";
import type { EntityHistoryChange } from "@/api/audit.api";

function formatOccurredAt(value: string): string {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ChangeRow({ change }: { change: EntityHistoryChange }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1 text-xs">
      <span className="shrink-0 font-medium text-gray-600 dark:text-gray-400">
        {change.fieldLabel}
      </span>
      <span className="min-w-0 flex-1 text-right text-gray-500 dark:text-gray-400">
        <span className="line-through">{formatValue(change.oldValue)}</span>
        <span className="mx-1.5 text-gray-300 dark:text-gray-600">→</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {formatValue(change.newValue)}
        </span>
      </span>
    </div>
  );
}

export interface EntityHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  aggregateType: string;
  aggregateId?: string;
  title?: string;
}

export function EntityHistoryDrawer({
  open,
  onClose,
  aggregateType,
  aggregateId,
  title = "Lịch sử thay đổi",
}: EntityHistoryDrawerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const historyQuery = useEntityHistory(aggregateType, aggregateId, {
    enabled: open,
  });

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      {historyQuery.isLoading ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Đang tải lịch sử...
        </p>
      ) : historyQuery.isError ? (
        <p className="py-6 text-center text-sm text-rose-600 dark:text-rose-400">
          Không tải được lịch sử thay đổi.
        </p>
      ) : !historyQuery.data || historyQuery.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Chưa có thay đổi nào được ghi nhận.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {historyQuery.data.map((event) => {
            const isExpanded = expandedIds.has(event.id);
            const hasChanges = event.changes.length > 0;
            return (
              <li key={event.id} className="py-3">
                <button
                  type="button"
                  onClick={() => hasChanges && toggle(event.id)}
                  className={`flex w-full items-start justify-between gap-3 text-left ${
                    hasChanges ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <EntityEventBadge eventType={event.eventType} />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {event.actorName ?? "Hệ thống"}
                      </span>
                    </div>
                    {event.reason && (
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {event.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                      {formatOccurredAt(event.occurredAt)}
                    </span>
                    {hasChanges && (
                      <span className="text-gray-400 dark:text-gray-500">
                        {isExpanded ? "−" : "+"}
                      </span>
                    )}
                  </div>
                </button>
                {isExpanded && hasChanges && (
                  <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                    {event.changes.map((change) => (
                      <ChangeRow key={change.fieldName} change={change} />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
