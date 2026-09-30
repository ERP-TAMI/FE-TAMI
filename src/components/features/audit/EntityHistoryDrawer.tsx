import { Fragment, useEffect, useState } from "react";
import { ChevronRight, History, Search } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Pagination } from "@/components/shared/Pagination";
import { useEntityHistory } from "@/hooks/useEntityHistory";
import type { EntityHistoryChange, EntityHistoryEvent } from "@/api/audit.api";
import { EntityEventBadge } from "./EntityEventBadge";
import {
  CONTROL_CLASS,
  DATE_PRESET_OPTIONS,
  formatClock,
  formatDay,
  useDateRange,
  type DatePreset,
} from "./auditShared";

const PAGE_SIZE = 20;
const MAX_SUMMARY_FIELDS = 3;

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
  if (Array.isArray(value)) return `${value.length} mục`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Tóm tắt ngay ở dòng thu gọn — 2 sự kiện cùng loại trên cùng bản ghi (VD
 * tạo lần may mẫu và thêm ảnh vào nó) chỉ phân biệt được nhờ dòng này. */
function summarizeChanges(event: EntityHistoryEvent): string {
  if (event.reason) return event.reason;
  if (event.changes.length === 0) return "—";
  const labels = [...new Set(event.changes.map((change) => change.fieldLabel))];
  if (labels.length <= MAX_SUMMARY_FIELDS) return labels.join(", ");
  return `${labels.slice(0, MAX_SUMMARY_FIELDS).join(", ")} và ${labels.length - MAX_SUMMARY_FIELDS} mục khác`;
}

/** Gom thay đổi theo dòng (lần lưu hàng loạt) để mỗi dòng có 1 tiêu đề riêng. */
function groupChanges(
  changes: EntityHistoryChange[],
): { groupLabel: string | null; items: EntityHistoryChange[] }[] {
  const groups: { groupLabel: string | null; items: EntityHistoryChange[] }[] = [];
  for (const change of changes) {
    const label = change.groupLabel ?? null;
    const last = groups.at(-1);
    if (last && last.groupLabel === label) last.items.push(change);
    else groups.push({ groupLabel: label, items: [change] });
  }
  return groups;
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function ChangesTable({ changes }: { changes: EntityHistoryChange[] }) {
  // Tạo mới thì mọi giá trị cũ đều trống — cả cột "Trống" chỉ gây nhiễu.
  const showOld = changes.some((change) => !isEmptyValue(change.oldValue));
  const columnCount = showOld ? 3 : 2;
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[26%]" />
          {showOld && <col className="w-[37%]" />}
          <col />
        </colgroup>
        <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
          <tr>
            <th className="px-4 py-2 font-medium">Trường</th>
            {showOld && <th className="px-4 py-2 font-medium">Giá trị cũ</th>}
            <th className="px-4 py-2 font-medium">{showOld ? "Giá trị mới" : "Giá trị"}</th>
          </tr>
        </thead>
        <tbody>
          {groupChanges(changes).map((group, groupIndex) => (
            // 2 công đoạn cùng tên trong 1 lần lưu → groupLabel trùng, nên
            // phải kèm vị trí để key luôn duy nhất.
            <Fragment key={`${groupIndex}:${group.groupLabel ?? ""}`}>
              {group.groupLabel && (
                <tr className="border-t border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/30">
                  <td
                    colSpan={columnCount}
                    className="px-4 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {group.groupLabel}
                  </td>
                </tr>
              )}
              {group.items.map((change, itemIndex) => (
                <tr
                  key={`${itemIndex}:${change.fieldName}`}
                  className="border-t border-gray-100 align-top dark:border-gray-800"
                >
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                    {change.fieldLabel}
                  </td>
                  {showOld && (
                    <td className="px-4 py-2 break-words text-gray-400 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600">
                      {formatValue(change.oldValue)}
                    </td>
                  )}
                  <td className="px-4 py-2 font-medium break-words text-gray-900 dark:text-gray-100">
                    {formatValue(change.newValue)}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
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
  // Xem theo cha thì mỗi sự kiện có thể thuộc 1 bản ghi con khác nhau → cần
  // cột "Đối tượng"; xem 1 bản ghi thì cột đó luôn giống nhau nên bỏ.
  const isBulkView = Boolean(parentId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    if (!open) return;
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
    setDatePreset("all");
    setCustomFrom("");
    setCustomTo("");
    setExpandedId(null);
  }, [open, aggregateId, parentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { from, to } = useDateRange(datePreset, customFrom, customTo);

  const historyQuery = useEntityHistory(
    {
      aggregateType,
      aggregateId,
      parentId,
      search: debouncedSearch || undefined,
      from,
      to,
      page,
      limit: PAGE_SIZE,
    },
    { enabled: open },
  );

  const items = historyQuery.data?.items ?? [];
  const columnCount = isBulkView ? 6 : 5;
  const isFiltering = search !== "" || datePreset !== "all";

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDatePreset("all");
    setCustomFrom("");
    setCustomTo("");
    setPage(1);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="2xl" closeOnClickOutside>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="relative w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm trong lịch sử"
              placeholder="Tìm theo tên bản ghi..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${CONTROL_CLASS} w-full pl-9`}
            />
          </div>
          <select
            aria-label="Khoảng thời gian"
            value={datePreset}
            onChange={(event) => {
              setDatePreset(event.target.value as DatePreset);
              setPage(1);
            }}
            className={CONTROL_CLASS}
          >
            {DATE_PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {datePreset === "custom" && (
            <>
              <input
                type="date"
                aria-label="Từ ngày"
                value={customFrom}
                onChange={(event) => {
                  setCustomFrom(event.target.value);
                  setPage(1);
                }}
                className={CONTROL_CLASS}
              />
              <span className="text-xs text-gray-400">đến</span>
              <input
                type="date"
                aria-label="Đến ngày"
                value={customTo}
                onChange={(event) => {
                  setCustomTo(event.target.value);
                  setPage(1);
                }}
                className={CONTROL_CLASS}
              />
            </>
          )}
          {isFiltering && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer px-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Xóa lọc
            </button>
          )}
        </div>

        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-10" />
            <col className="w-[110px]" />
            <col className="w-[130px]" />
            <col className="w-[18%]" />
            {isBulkView && <col className="w-[20%]" />}
            <col />
          </colgroup>
          <thead className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th className="py-2.5" />
              <th className="px-3 py-2.5 font-medium">Thời gian</th>
              <th className="px-3 py-2.5 font-medium">Hành động</th>
              <th className="px-3 py-2.5 font-medium">Người thực hiện</th>
              {isBulkView && <th className="px-3 py-2.5 font-medium">Đối tượng</th>}
              <th className="px-3 py-2.5 font-medium">Nội dung thay đổi</th>
            </tr>
          </thead>
          <tbody>
            {historyQuery.isLoading ? (
              Array.from({ length: 4 }, (_, index) => (
                <tr key={index} className="border-t border-gray-100 dark:border-gray-800">
                  <td colSpan={columnCount} className="px-4 py-3">
                    <div className="h-5 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : historyQuery.isError ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-10 text-center text-sm text-red-600">
                  Không tải được lịch sử thay đổi.
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-12 text-center">
                  <History className="mx-auto h-9 w-9 text-gray-300 dark:text-gray-600" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {isFiltering
                      ? "Không có thay đổi nào khớp bộ lọc."
                      : "Chưa có thay đổi nào được ghi nhận."}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((event) => {
                const hasChanges = event.changes.length > 0;
                const isExpanded = expandedId === event.id;
                const summary = summarizeChanges(event);
                return (
                  <Fragment key={event.id}>
                    <tr
                      onClick={() => hasChanges && setExpandedId(isExpanded ? null : event.id)}
                      aria-expanded={hasChanges ? isExpanded : undefined}
                      className={`border-t border-gray-100 transition-colors dark:border-gray-800 ${
                        hasChanges
                          ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                          : ""
                      } ${isExpanded ? "bg-gray-50/70 dark:bg-gray-800/30" : ""}`}
                    >
                      <td className="py-2.5 pl-4">
                        {hasChanges && (
                          <ChevronRight
                            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            aria-hidden="true"
                          />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-gray-900 dark:text-gray-100">
                          {formatClock(event.occurredAt)}
                        </div>
                        <div className="text-xs text-gray-400">{formatDay(event.occurredAt)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <EntityEventBadge eventType={event.eventType} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div
                          className="truncate text-gray-700 dark:text-gray-300"
                          title={event.actorName ?? undefined}
                        >
                          {event.actorName ?? "Hệ thống"}
                        </div>
                      </td>
                      {isBulkView && (
                        <td className="px-3 py-2.5">
                          <div
                            className="truncate font-medium text-gray-900 dark:text-gray-100"
                            title={event.targetLabel ?? undefined}
                          >
                            {event.targetLabel ?? "—"}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <div className="truncate text-gray-600 dark:text-gray-400" title={summary}>
                          {summary}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50/70 dark:bg-gray-800/30">
                        <td colSpan={columnCount} className="px-4 pt-1 pb-4">
                          <ChangesTable changes={event.changes} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {historyQuery.data && historyQuery.data.totalPages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={historyQuery.data.total}
              totalPages={historyQuery.data.totalPages}
              itemLabel="thay đổi"
              onPageChange={(next) => {
                setPage(next);
                setExpandedId(null);
              }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
