import type { PoStatus } from "@/types/po";

/** Số ngày còn lại tính từ đó Hạn hoàn thành được coi là "sắp tới hạn". */
const DEADLINE_SOON_DAYS = 7;

export type DeadlineTone = "overdue" | "soon" | "normal";

export const deadlineValueClasses: Record<DeadlineTone, string> = {
  overdue: "text-error-600 dark:text-error-400",
  soon: "text-warning-600 dark:text-warning-400",
  normal: "text-gray-800 dark:text-gray-200",
};

export const deadlineHintClasses: Record<DeadlineTone, string> = {
  overdue:
    "border-error-200 bg-error-50 text-error-700 dark:border-error-900/40 dark:bg-error-950/40 dark:text-error-300",
  soon: "border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-900/40 dark:bg-warning-950/40 dark:text-warning-300",
  normal: "",
};

export const deadlinePillClasses: Record<DeadlineTone, string> = {
  overdue:
    "bg-error-50 text-error-700 dark:bg-error-950/40 dark:text-error-300",
  soon: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  normal: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

/**
 * Trạng thái hạn hoàn thành. PO đã khóa hoặc đã hủy thì không cảnh báo nữa
 * vì đơn đã kết thúc, tô đỏ chỉ gây nhiễu.
 */
export function getDeadlineInfo(
  deadline: string | null | undefined,
  status: PoStatus | undefined,
): { tone: DeadlineTone; hint: string | null } {
  if (!deadline || status === "closed" || status === "cancelled") {
    return { tone: "normal", hint: null };
  }

  const due = new Date(deadline);
  if (isNaN(due.getTime())) return { tone: "normal", hint: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) {
    return { tone: "overdue", hint: `Quá hạn ${Math.abs(diffDays)} ngày` };
  }
  if (diffDays === 0) return { tone: "soon", hint: "Đến hạn hôm nay" };
  if (diffDays <= DEADLINE_SOON_DAYS) {
    return { tone: "soon", hint: `Còn ${diffDays} ngày` };
  }
  return { tone: "normal", hint: null };
}
