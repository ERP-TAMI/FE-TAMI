import type { ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string | number;
  emptyMessage?: string;
};

export function Table<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = "No records found.",
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-white/[0.03]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="text-theme-xs px-4 py-3 text-left font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
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
                    className="text-theme-sm px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300"
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
