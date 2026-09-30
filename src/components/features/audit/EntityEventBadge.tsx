import {
  Plus,
  Pencil,
  Trash2,
  RefreshCcw,
  Check,
  X,
  Paperclip,
  Unlink,
  FileStack,
  Copy,
  LogIn,
  KeyRound,
  UserCog,
  type LucideIcon,
} from "lucide-react";
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

/** Động từ dùng trong câu tường thuật, VD "Nguyên {đã cập nhật} Công đoạn cắt vải". */
const EVENT_VERBS: Record<AuditEventType, string> = {
  created: "đã tạo mới",
  updated: "đã cập nhật",
  deleted: "đã xoá",
  status_changed: "đã đổi trạng thái",
  approved: "đã duyệt",
  rejected: "đã từ chối",
  document_linked: "đã gắn tài liệu vào",
  document_unlinked: "đã gỡ tài liệu khỏi",
  document_version_added: "đã thêm phiên bản cho",
  copied: "đã sao chép",
  synced: "đã đồng bộ",
  login: "đã đăng nhập",
  password_changed: "đã đổi mật khẩu",
  role_changed: "đã đổi vai trò",
};

type EventTheme = {
  icon: LucideIcon;
  /** Vòng tròn icon trên dòng thời gian. */
  dot: string;
  /** Badge chữ nhỏ, dùng màu nhạt hơn dot. */
  badge: string;
};

const EVENT_THEMES: Record<AuditEventType, EventTheme> = {
  created: {
    icon: Plus,
    dot: "bg-emerald-500 text-white dark:bg-emerald-600",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40",
  },
  updated: {
    icon: Pencil,
    dot: "bg-blue-500 text-white dark:bg-blue-600",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
  },
  deleted: {
    icon: Trash2,
    dot: "bg-rose-500 text-white dark:bg-rose-600",
    badge:
      "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40",
  },
  status_changed: {
    icon: RefreshCcw,
    dot: "bg-purple-500 text-white dark:bg-purple-600",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40",
  },
  approved: {
    icon: Check,
    dot: "bg-emerald-500 text-white dark:bg-emerald-600",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40",
  },
  rejected: {
    icon: X,
    dot: "bg-rose-500 text-white dark:bg-rose-600",
    badge:
      "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40",
  },
  document_linked: {
    icon: Paperclip,
    dot: "bg-blue-500 text-white dark:bg-blue-600",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
  },
  document_unlinked: {
    icon: Unlink,
    dot: "bg-gray-400 text-white dark:bg-gray-600",
    badge:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  },
  document_version_added: {
    icon: FileStack,
    dot: "bg-blue-500 text-white dark:bg-blue-600",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
  },
  copied: {
    icon: Copy,
    dot: "bg-gray-400 text-white dark:bg-gray-600",
    badge:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  },
  synced: {
    icon: RefreshCcw,
    dot: "bg-gray-400 text-white dark:bg-gray-600",
    badge:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  },
  login: {
    icon: LogIn,
    dot: "bg-gray-400 text-white dark:bg-gray-600",
    badge:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  },
  password_changed: {
    icon: KeyRound,
    dot: "bg-purple-500 text-white dark:bg-purple-600",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40",
  },
  role_changed: {
    icon: UserCog,
    dot: "bg-purple-500 text-white dark:bg-purple-600",
    badge:
      "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40",
  },
};

const DEFAULT_THEME: EventTheme = {
  icon: Pencil,
  dot: "bg-gray-400 text-white dark:bg-gray-600",
  badge:
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
};

export function getEventLabel(eventType: AuditEventType): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function getEventVerb(eventType: AuditEventType): string {
  return EVENT_VERBS[eventType] ?? "đã thay đổi";
}

export function getEventTheme(eventType: AuditEventType): EventTheme {
  return EVENT_THEMES[eventType] ?? DEFAULT_THEME;
}

export function EntityEventBadge({ eventType }: { eventType: AuditEventType }) {
  const theme = getEventTheme(eventType);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}
    >
      {getEventLabel(eventType)}
    </span>
  );
}

/** Vòng tròn icon trên dòng thời gian dọc (timeline), màu theo loại sự kiện. */
export function EntityEventDot({ eventType }: { eventType: AuditEventType }) {
  const theme = getEventTheme(eventType);
  const Icon = theme.icon;
  return (
    <span
      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm dark:border-gray-900 ${theme.dot}`}
      aria-hidden="true"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}
