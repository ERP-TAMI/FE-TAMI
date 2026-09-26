import type { BomType } from "@/types/bom";

interface BomTypeBadgeProps {
  type: BomType;
  showDot?: boolean;
}

export function BomTypeBadge({ type, showDot = true }: BomTypeBadgeProps) {
  if (type === "fit") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dce3fc] bg-[#EEF2FF] px-2.5 py-0.5 text-xs font-medium leading-none text-[#6370A0] dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
        {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6370A0]" />}
        Mẫu Fit
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/60 bg-brand-50/60 px-2.5 py-0.5 text-xs font-medium leading-none text-brand-600 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-400">
      {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
      PO
    </span>
  );
}
