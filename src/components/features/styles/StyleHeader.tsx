import { Link } from "react-router-dom";
import type { StyleStatus } from "@/types/style";
import { StyleStatusBadge } from "./StyleStatusBadge";

interface Props {
  styleCode: string;
  styleName: string;
  category?: string | null;
  status: StyleStatus;
  activeTabLabel?: string;
  onEditClick: () => void;
}

export function StyleHeader({
  styleCode,
  styleName,
  category,
  status,
  activeTabLabel,
  onEditClick,
}: Props) {
  return (
    <div className="space-y-3 pb-4 border-b border-gray-200/80 dark:border-gray-800">
      {/* Dynamic Multi-level Categorized & Active Tab Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Link
          to="/dashboard"
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Dashboard
        </Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <Link
          to="/styles"
          className="hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Mẫu Fit
        </Link>
        {category && (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <Link
              to={`/styles?category=${encodeURIComponent(category)}`}
              className="hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
            >
              {category}
            </Link>
          </>
        )}
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
          {styleCode}
        </span>
        {activeTabLabel && (
          <>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {activeTabLabel}
            </span>
          </>
        )}
      </nav>

      {/* Main Compact Identity Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {styleName}
            </h1>
            <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
              {styleCode}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {category && (
              <>
                <span>
                  Dòng sản phẩm:{" "}
                  <strong className="text-gray-700 dark:text-gray-200 font-medium">
                    {category}
                  </strong>
                </span>
                <span className="text-gray-300 dark:text-gray-700">•</span>
              </>
            )}
            <div className="flex items-center gap-1.5">
              <StyleStatusBadge status={status} />
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditClick}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}
