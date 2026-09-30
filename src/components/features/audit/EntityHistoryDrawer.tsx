import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { useEntityHistory } from "@/hooks/useEntityHistory";
import { EntityEventBadge } from "./EntityEventBadge";
import type { EntityHistoryChange } from "@/api/audit.api";

const PAGE_SIZE = 20;

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
  /** Lịch sử của đúng 1 bản ghi. Bỏ trống nếu dùng parentId. */
  aggregateId?: string;
  /** Lịch sử của mọi bản ghi con thuộc 1 cha (VD mọi công đoạn của 1 Style). */
  parentId?: string;
  title?: string;
}

export function EntityHistoryDrawer({
  open,
  onClose,
  aggregateType,
  aggregateId,
  parentId,
  title = "Lịch sử thay đổi",
}: EntityHistoryDrawerProps) {
  const isBulkView = Boolean(parentId);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
    setExpandedIds(new Set());
  }, [open, aggregateId, parentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const historyQuery = useEntityHistory(
    {
      aggregateType,
      aggregateId,
      parentId,
      search: isBulkView ? debouncedSearch || undefined : undefined,
      page,
      limit: PAGE_SIZE,
    },
    { enabled: open },
  );

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const items = historyQuery.data?.items ?? [];

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      {isBulkView && (
        <div className="relative mb-3">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          <Input
            type="search"
            aria-label="Tìm trong lịch sử"
            placeholder="Tìm theo tên bản ghi..."
            value={search}
            className="border-gray-300 bg-white pl-9 text-sm dark:border-gray-600 dark:bg-gray-900"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}

      {historyQuery.isLoading ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Đang tải lịch sử...
        </p>
      ) : historyQuery.isError ? (
        <p className="py-6 text-center text-sm text-rose-600 dark:text-rose-400">
          Không tải được lịch sử thay đổi.
        </p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {debouncedSearch
            ? "Không tìm thấy thay đổi nào khớp."
            : "Chưa có thay đổi nào được ghi nhận."}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((event) => {
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
                      {isBulkView && event.targetLabel && (
                        <span className="truncate text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {event.targetLabel}
                        </span>
                      )}
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

      {historyQuery.data && historyQuery.data.totalPages > 1 && (
        <div className="mt-3">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={historyQuery.data.total}
            totalPages={historyQuery.data.totalPages}
            itemLabel="thay đổi"
            onPageChange={setPage}
          />
        </div>
      )}
    </Modal>
  );
}
