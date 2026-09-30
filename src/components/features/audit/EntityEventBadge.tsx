import type { AuditEventType } from "@/api/audit.api";
import {
  BADGE_AMBER,
  BADGE_BASE,
  BADGE_BLUE,
  BADGE_GREEN,
  BADGE_NEUTRAL,
  BADGE_PURPLE,
  BADGE_RED,
} from "./auditShared";

const EVENT_LABELS: Record<AuditEventType, string> = {
  created: "Tạo mới",
  updated: "Cập nhật",
  deleted: "Xoá",
  status_changed: "Đổi trạng thái",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  document_linked: "Gắn tài liệu",
  document_unlinked: "Gỡ tài liệu",
  document_version_added: "Thêm ảnh",
  copied: "Sao chép",
  synced: "Đồng bộ",
  login: "Đăng nhập",
  password_changed: "Đổi mật khẩu",
  role_changed: "Đổi vai trò",
};

const EVENT_COLORS: Record<AuditEventType, string> = {
  created: BADGE_GREEN,
  updated: BADGE_BLUE,
  deleted: BADGE_RED,
  status_changed: BADGE_AMBER,
  approved: BADGE_GREEN,
  rejected: BADGE_RED,
  document_linked: BADGE_PURPLE,
  document_unlinked: BADGE_NEUTRAL,
  document_version_added: BADGE_PURPLE,
  copied: BADGE_NEUTRAL,
  synced: BADGE_NEUTRAL,
  login: BADGE_NEUTRAL,
  password_changed: BADGE_AMBER,
  role_changed: BADGE_AMBER,
};

export function getEventLabel(eventType: AuditEventType): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function EntityEventBadge({ eventType }: { eventType: AuditEventType }) {
  return (
    <span className={`${BADGE_BASE} ${EVENT_COLORS[eventType] ?? BADGE_NEUTRAL}`}>
      {getEventLabel(eventType)}
    </span>
  );
}
