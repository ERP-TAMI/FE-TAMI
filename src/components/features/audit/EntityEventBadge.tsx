import type { AuditEventType } from "@/api/audit.api";

const EVENT_LABELS: Record<AuditEventType, string> = {
  created: "Tạo mới",
  updated: "Cập nhật",
  deleted: "Xoá",
  status_changed: "Đổi trạng thái",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  document_linked: "Gắn tài liệu",
  document_unlinked: "Gỡ tài liệu",
  document_version_added: "Thêm phiên bản",
  copied: "Sao chép",
  synced: "Đồng bộ",
  login: "Đăng nhập",
  password_changed: "Đổi mật khẩu",
  role_changed: "Đổi vai trò",
};

const EVENT_COLORS: Partial<Record<AuditEventType, string>> = {
  created:
    "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40",
  updated:
    "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
  deleted:
    "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40",
  status_changed:
    "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40",
  approved:
    "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40",
  rejected:
    "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40",
};

const DEFAULT_COLOR =
  "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

export function EntityEventBadge({ eventType }: { eventType: AuditEventType }) {
  const color = EVENT_COLORS[eventType] ?? DEFAULT_COLOR;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {EVENT_LABELS[eventType] ?? eventType}
    </span>
  );
}
