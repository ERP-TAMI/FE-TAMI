import { useState } from "react";
import { TimeIcon } from "@/icons";
import { EntityHistoryDrawer } from "./EntityHistoryDrawer";

export interface EntityHistoryButtonProps {
  aggregateType: string;
  aggregateId?: string;
  title?: string;
  label?: string;
}

/** Small icon trigger + drawer bundle — drop into any row/detail header to expose "who changed this, when". */
export function EntityHistoryButton({
  aggregateType,
  aggregateId,
  title,
  label = "Xem lịch sử thay đổi",
}: EntityHistoryButtonProps) {
  const [open, setOpen] = useState(false);

  if (!aggregateId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-none hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-900/50 dark:hover:bg-brand-950/30 dark:hover:text-brand-400"
        title={label}
        aria-label={label}
      >
        <TimeIcon className="h-4 w-4" />
      </button>
      <EntityHistoryDrawer
        open={open}
        onClose={() => setOpen(false)}
        aggregateType={aggregateType}
        aggregateId={aggregateId}
        title={title}
      />
    </>
  );
}
