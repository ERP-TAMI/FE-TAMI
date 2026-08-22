import type { ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "center" | "right";
  width?: "standard" | "wide";
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
  embedded?: boolean;
};

export function Table<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "Không có dữ liệu.",
  embedded = false,
}: TableProps<T>) {
  return (
    <div
      className={
        embedded
          ? "overflow-x-auto"
          : "overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800"
      }
    >
      <table className="w-full min-w-3xl table-fixed divide-y divide-gray-200 dark:divide-gray-800">
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.key}
              className={
                column.width === "wide"
                  ? "w-1/3"
                  : column.width === "standard"
                    ? "w-1/6"
                    : undefined
              }
            />
          ))}
        </colgroup>
        <thead className="bg-white dark:bg-gray-900">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`text-theme-sm px-6 py-4 font-medium text-gray-500 dark:text-gray-400 ${
                  column.align === "right"
                    ? "text-right"
                    : column.align === "center"
                      ? "text-center"
                      : "text-left"
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-theme-sm px-4 py-10 text-center text-gray-500 dark:text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className="hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`text-theme-sm px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300 ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                          ? "text-center"
                          : "text-left"
                    }`}
                  >
                    {column.render ? column.render(row) : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
