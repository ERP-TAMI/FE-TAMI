import { Fragment, type HTMLAttributes, type ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  /** Tailwind width utility for the column, e.g. "w-[16%]". Omit to share remaining space evenly. */
  width?: string;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  getRowProps?: (row: T, index: number) => HTMLAttributes<HTMLTableRowElement>;
  renderExpandedRow?: (row: T, index: number) => ReactNode;
  tableClassName?: string;
  emptyMessage?: ReactNode;
  embedded?: boolean;
  loading?: boolean;
  loadingRowCount?: number;
};

function alignClass(align?: "left" | "center" | "right") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function Table<T>({
  columns,
  rows,
  getRowKey,
  getRowProps,
  renderExpandedRow,
  tableClassName = "",
  emptyMessage = "Không có dữ liệu.",
  embedded = false,
  loading = false,
  loadingRowCount = 5,
}: TableProps<T>) {
  return (
    <div
      className={
        embedded
          ? "overflow-x-auto"
          : "overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800"
      }
    >
      <table
        className={`text-theme-sm w-full table-fixed text-left text-gray-700 dark:text-gray-200 ${tableClassName}`}
      >
        <thead className="text-theme-xs border-b border-gray-200 bg-gray-50/80 font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-400">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-5 py-3.5 font-semibold whitespace-nowrap ${column.width ?? ""} ${alignClass(column.align)}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {loading ? (
            Array.from({ length: loadingRowCount }, (_, index) => (
              <tr key={`skeleton-${index}`} className="h-16">
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4">
                    <div className="h-4 w-full max-w-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-theme-sm px-4 py-10 text-center text-gray-500 dark:text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const rowProps = getRowProps?.(row, index);
              const expandedContent = renderExpandedRow?.(row, index);
              return (
                <Fragment key={getRowKey(row, index)}>
                  <tr
                    {...rowProps}
                    className={`group h-16 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50 ${rowProps?.className ?? ""}`}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className={`px-5 py-4 ${alignClass(column.align)}`}>
                        {column.render ? column.render(row) : null}
                      </td>
                    ))}
                  </tr>
                  {expandedContent !== null && expandedContent !== undefined && (
                    <tr className="bg-gray-50/60 dark:bg-gray-950/20">
                      <td colSpan={columns.length} className="p-0">
                        {expandedContent}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
