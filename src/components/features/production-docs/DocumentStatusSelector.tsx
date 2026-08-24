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
    <div className="relative inline-flex items-center">
      <span
        className={`absolute left-2.5 h-1.5 w-1.5 rounded-full pointer-events-none ${dotStyles[status]}`}
      />
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as ProductionDocStatus)}
        className={`appearance-none rounded-lg border pl-5 pr-6 py-1 text-xs font-semibold focus:outline-none transition-colors cursor-pointer ${statusStyles[status]}`}
      >
        <option value="draft">Nháp</option>
        <option value="in_progress">Đang soạn</option>
        <option value="completed">Hoàn tất</option>
      </select>
      <span className="absolute right-2 text-[9px] text-gray-400 pointer-events-none">
        ▼
      </span>
    </div>
  );
}
