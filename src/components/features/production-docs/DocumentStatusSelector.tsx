import type { ProductionDocStatus } from "@/types/production-doc";

interface Props {
  status: ProductionDocStatus;
  onChange: (newStatus: ProductionDocStatus) => void;
}

export function DocumentStatusSelector({ status, onChange }: Props) {
  const statusStyles: Record<ProductionDocStatus, string> = {
    draft:
      "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
    in_progress:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300",
    completed:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300",
  };

  const dotStyles: Record<ProductionDocStatus, string> = {
    draft: "bg-gray-400",
    in_progress: "bg-amber-500",
    completed: "bg-emerald-500",
  };

  return (
    <label className="inline-flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Trạng thái</span>
      <div className="relative inline-flex items-center">
        <span
          className={`pointer-events-none absolute left-3 h-2 w-2 rounded-full ${dotStyles[status]}`}
        />
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as ProductionDocStatus)}
        aria-label="Trạng thái tài liệu"
        className={`h-9 appearance-none rounded-lg border pl-7 pr-8 text-sm font-semibold transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none dark:focus:ring-blue-950 ${statusStyles[status]}`}
      >
        <option value="draft">Nháp</option>
        <option value="in_progress">Đang soạn</option>
        <option value="completed">Hoàn tất</option>
      </select>
        <span className="pointer-events-none absolute right-3 text-xs text-gray-400">⌄</span>
      </div>
    </label>
  );
}
