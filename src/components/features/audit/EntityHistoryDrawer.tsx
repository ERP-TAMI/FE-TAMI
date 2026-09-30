import { useEffect, useState } from "react";
import { ChevronDown, History, Search } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/shared/Input";
import { Pagination } from "@/components/shared/Pagination";
import { useEntityHistory } from "@/hooks/useEntityHistory";
import { EntityEventDot, getEventVerb } from "./EntityEventBadge";
import type { EntityHistoryChange, EntityHistoryEvent } from "@/api/audit.api";

const PAGE_SIZE = 20;
const MAX_SUMMARY_FIELDS = 3;

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Trống";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "string" && ISO_DATETIME_RE.test(value)) {
    const [datePart, timePart] = value.split("T");
    const [year, month, day] = datePart.split("-");
    // Cột kiểu date (VD ngày may mẫu) được serialize thành nửa đêm UTC — chỉ
    // hiện ngày, không hiện giờ 00:00 gây hiểu nhầm là "có thời điểm cụ thể".
    if (timePart.startsWith("00:00:00")) return `${day}/${month}/${year}`;
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Tóm tắt field nào đổi ngay ở dòng thu gọn — quan trọng khi 2 sự kiện cùng
 * eventType + targetLabel (VD "tạo lần may mẫu" và "thêm ảnh vào lần may mẫu
 * đó" đều là CREATED trên cùng 1 round) chỉ phân biệt được nhờ dòng này. */
function summarizeChanges(event: EntityHistoryEvent): string | null {
  if (event.reason) return event.reason;
  if (event.changes.length === 0) return null;
  const labels = event.changes.map((change) => change.fieldLabel);
  if (labels.length <= MAX_SUMMARY_FIELDS) return labels.join(", ");
  const shown = labels.slice(0, MAX_SUMMARY_FIELDS).join(", ");
  return `${shown} và ${labels.length - MAX_SUMMARY_FIELDS} mục khác`;
}

function ChangeRow({ change }: { change: EntityHistoryChange }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
      <span className="w-full shrink-0 text-theme-xs font-semibold text-gray-600 sm:w-36 dark:text-gray-400">
        {change.fieldLabel}
      </span>
      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-rose-50 px-2 py-0.5 text-theme-xs text-rose-700 line-through decoration-rose-400/70 dark:bg-rose-950/30 dark:text-rose-400">
        {formatValue(change.oldValue)}
      </span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 -rotate-90 text-gray-300 dark:text-gray-600" />
      <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-theme-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        {formatValue(change.newValue)}
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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
    setDateFrom("");
    setDateTo("");
    setExpandedIds(new Set());
  }, [open, aggregateId, parentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const isDateFiltering = dateFrom !== "" || dateTo !== "";

  const historyQuery = useEntityHistory(
    {
      aggregateType,
      aggregateId,
      parentId,
      search: isBulkView ? debouncedSearch || undefined : undefined,
      // occurredAt là timestamp đầy đủ (không chỉ ngày) — "đến" phải là cuối
      // ngày đã chọn, không thì các thay đổi xảy ra sau 00:00 cùng ngày sẽ bị
      // loại khỏi kết quả.
      from: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
      to: dateTo ? `${dateTo}T23:59:59.999Z` : undefined,
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
  const total = historyQuery.data?.total ?? 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="2xl"
      closeOnClickOutside
    >
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900/40">
        <div className="border-b border-gray-100 bg-gray-50/75 px-5 py-3.5 dark:border-gray-800 dark:bg-gray-800/40">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Nhật ký thay đổi
            </h3>
            <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              {total > 0
                ? `${total} thay đổi được ghi nhận`
                : "Chưa có thay đổi nào được ghi nhận"}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isBulkView && (
              <div className="relative w-64">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </span>
                <Input
                  type="search"
                  aria-label="Tìm trong lịch sử"
                  placeholder="Tìm theo tên bản ghi..."
                  value={search}
                  className="border-gray-300 bg-white pl-9 text-theme-sm dark:border-gray-600 dark:bg-gray-900"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            )}
            <input
              type="date"
              aria-label="Từ ngày"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
            <span className="text-theme-xs text-gray-400">đến</span>
            <input
              type="date"
              aria-label="Đến ngày"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-theme-sm text-gray-900 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
            {isDateFiltering && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
                className="cursor-pointer text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Xóa lọc ngày
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-5">
          {historyQuery.isLoading ? (
            <div className="flex flex-col gap-4 py-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : historyQuery.isError ? (
            <p className="py-8 text-center text-theme-sm text-rose-600 dark:text-rose-400">
              Không tải được lịch sử thay đổi.
            </p>
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <History className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">
                {debouncedSearch || isDateFiltering
                  ? "Không tìm thấy thay đổi nào khớp."
                  : "Chưa có thay đổi nào được ghi nhận."}
              </p>
            </div>
          ) : (
            <ul className="relative">
              <div
                className="absolute top-2 bottom-2 left-4 w-px bg-gray-200 dark:bg-gray-800"
                aria-hidden="true"
              />
              {items.map((event) => {
                const isExpanded = expandedIds.has(event.id);
                const hasChanges = event.changes.length > 0;
                const summary = summarizeChanges(event);
                return (
                  <li key={event.id} className="relative flex gap-4 pb-5 last:pb-0">
                    <EntityEventDot eventType={event.eventType} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => hasChanges && toggle(event.id)}
                        aria-expanded={hasChanges ? isExpanded : undefined}
                        className={`flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-1 rounded-xl border border-transparent px-3 py-2 text-left transition-colors focus-visible:ring-brand-500/40 focus-visible:outline-none focus-visible:ring-2 ${
                          hasChanges
                            ? "cursor-pointer hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-800 dark:hover:bg-gray-800/40"
                            : "cursor-default"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-theme-sm text-gray-800 dark:text-gray-200">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {event.actorName ?? "Hệ thống"}
                            </span>{" "}
                            {getEventVerb(event.eventType)}
                            {isBulkView && event.targetLabel && (
                              <>
                                {" "}
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {event.targetLabel}
                                </span>
                              </>
                            )}
                          </p>
                          {summary && (
                            <p className="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
                              {summary}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <div className="text-right">
                            <div className="font-mono text-theme-sm font-bold text-gray-900 dark:text-white">
                              {formatTime(event.occurredAt)}
                            </div>
                            <div className="text-theme-xs text-gray-400 dark:text-gray-500">
                              {formatDate(event.occurredAt)}
                            </div>
                          </div>
                          {hasChanges && (
                            <ChevronDown
                              className={`h-4 w-4 text-gray-400 transition-transform dark:text-gray-500 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </button>

                      {isExpanded && hasChanges && (
                        <div className="mt-1.5 ml-3 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/60 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-800/30">
                          {event.changes.map((change) => (
                            <ChangeRow key={change.fieldName} change={change} />
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {historyQuery.data && historyQuery.data.totalPages > 1 && (
            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
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
        </div>
      </div>
    </Modal>
  );
}
