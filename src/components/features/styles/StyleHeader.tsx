import { PageHeader } from "@/components/shared";
import type { StyleStatus } from "@/types/style";
import { StyleStatusBadge } from "./StyleStatusBadge";

interface Props {
  styleCode: string;
  styleName: string;
  status: StyleStatus;
}

export function StyleHeader({
  styleCode,
  styleName,
  status,
}: Props) {
  return (
    <div className="space-y-2.5">
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Mẫu Fit", to: "/styles" },
          { label: styleCode },
        ]}
        title="Chi tiết mẫu Fit"
      />

      {/* Unified identity card */}
      <div className="-mt-1 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-base sm:text-lg font-bold tracking-tight leading-none text-gray-900 dark:text-white">
            {styleName}
          </h1>
          <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
            {styleCode}
          </span>
          <StyleStatusBadge status={status} />
        </div>
      </div>
    </div>
  );
}
