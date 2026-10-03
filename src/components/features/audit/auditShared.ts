import { useMemo } from "react";

// Bộ màu badge dùng chung cho Nhật ký hệ thống và khung Lịch sử theo bản ghi,
// để cùng 1 loại hành động luôn cùng 1 màu ở mọi nơi.
export const BADGE_NEUTRAL =
  "bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-400/20";
export const BADGE_GREEN =
  "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-400/20";
export const BADGE_BLUE =
  "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-400/20";
export const BADGE_RED =
  "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-400/20";
export const BADGE_PURPLE =
  "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-400/20";
export const BADGE_AMBER =
  "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/20";

export const BADGE_BASE =
  "inline-flex max-w-full items-center gap-1.5 truncate rounded-md px-2 py-1 text-xs leading-none font-medium whitespace-nowrap ring-1 ring-inset";

export const CONTROL_CLASS =
  "h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-400 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";

export type DatePreset = "today" | "7d" | "30d" | "all" | "custom";

export const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "all", label: "Tất cả thời gian" },
  { value: "custom", label: "Tùy chọn..." },
];

/** Khoảng thời gian theo giờ máy người dùng — tính trong useMemo để queryKey
 * không đổi mỗi lần render (new Date() khác nhau từng mili-giây). */
export function useDateRange(preset: DatePreset, customFrom: string, customTo: string) {
  return useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysAgo = (days: number) =>
      new Date(startOfToday.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
    switch (preset) {
      case "today":
        return { from: startOfToday.toISOString(), to: undefined };
      case "7d":
        return { from: daysAgo(6), to: undefined };
      case "30d":
        return { from: daysAgo(29), to: undefined };
      case "custom":
        return {
          from: customFrom ? new Date(`${customFrom}T00:00:00`).toISOString() : undefined,
          to: customTo ? new Date(`${customTo}T23:59:59.999`).toISOString() : undefined,
        };
      default:
        return { from: undefined, to: undefined };
    }
  }, [preset, customFrom, customTo]);
}

export function formatClock(value: string): string {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDay(value: string): string {
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
