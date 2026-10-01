import { Clock3, History } from "lucide-react";
import { useState } from "react";
import type { EntityHistoryChange, EntityHistoryEvent } from "@/api/audit.api";
import { useEntityHistory } from "@/hooks/useEntityHistory";
import type { AuthUser } from "@/store/authStore";
import { Alert, Button, Pagination } from "@/components/shared";
import { EntityEventBadge, getEventLabel } from "@/components/features/audit/EntityEventBadge";
import { formatClock, formatDay } from "@/components/features/audit/auditShared";

const PAGE_SIZE = 8;

function getActivityFieldLabel(change: EntityHistoryChange) {
  if (
    change.fieldName === "fullName" ||
    change.fieldName === "full_name" ||
    change.fieldLabel === "fullName"
  ) {
    return "Họ và tên";
  }
  return change.fieldLabel;
}

function getActivityDescription(event: EntityHistoryEvent) {
  if (event.eventType === "login") return "Đăng nhập thành công";
  if (event.eventType === "password_changed") return "Mật khẩu tài khoản đã được cập nhật";
  if (event.eventType === "role_changed") return "Vai trò tài khoản đã được thay đổi";
  if (event.eventType === "updated") {
    const changedFields = event.changes.map(getActivityFieldLabel);
    return changedFields.length > 0
      ? `Cập nhật ${changedFields
          .map((fieldLabel) => (fieldLabel === "Họ và tên" ? "họ và tên" : fieldLabel))
          .join(", ")}`
      : "Thông tin tài khoản đã được cập nhật";
  }
  return event.reason ?? getEventLabel(event.eventType);
}

export function ProfileActivityTab({ user }: { user: AuthUser }) {
  const [page, setPage] = useState(1);
  const history = useEntityHistory(
    {
      aggregateType: "User",
      aggregateId: user.id,
      page,
      limit: PAGE_SIZE,
    },
  );

  if (history.isPending) {
    return (
      <div role="status" aria-label="Đang tải lịch sử hoạt động" className="space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800/60"
          />
        ))}
      </div>
    );
  }

  if (history.isError) {
    return (
      <div className="space-y-3">
        <Alert variant="error" title="Không tải được lịch sử hoạt động">
          Vui lòng thử lại sau.
        </Alert>
        <Button
          type="button"
          variant="outline"
          onClick={() => void history.refetch()}
          className="cursor-pointer"
        >
          Thử lại
        </Button>
        {page > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((currentPage) => currentPage - 1)}
            className="cursor-pointer"
          >
            Trang trước
          </Button>
        )}
      </div>
    );
  }

  if (history.data.items.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-5 py-12 text-center dark:border-gray-800"
      >
        <History aria-hidden="true" className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        <p className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-200">
          Chưa có dữ liệu hoạt động để hiển thị.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ol aria-label="Lịch sử hoạt động tài khoản" className="divide-y divide-gray-100 dark:divide-gray-800">
        {history.data.items.map((event) => (
          <li key={event.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Clock3 aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getActivityDescription(event)}
                </p>
                <EntityEventBadge eventType={event.eventType} />
              </div>
              {event.changes.length > 0 && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {event.changes.map(getActivityFieldLabel).join(", ")}
                </p>
              )}
            </div>
            <time
              dateTime={event.occurredAt}
              className="shrink-0 text-xs text-gray-500 dark:text-gray-400 sm:text-right"
            >
              {formatDay(event.occurredAt)} · {formatClock(event.occurredAt).slice(0, 5)}
            </time>
          </li>
        ))}
      </ol>
      {history.data.totalPages > 1 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={history.data.total}
          totalPages={history.data.totalPages}
          itemLabel="hoạt động"
          onPageChange={setPage}
          className="flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"
        />
      )}
    </div>
  );
}
