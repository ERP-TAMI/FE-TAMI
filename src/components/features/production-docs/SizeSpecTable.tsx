import type { ProductionDocSizeRow } from "@/types/production-doc";

interface Props {
  rows: ProductionDocSizeRow[];
}

export function SizeSpecTable({ rows }: Props) {
  const realRows = (rows || []).filter(
    (r) =>
      r.measurementName &&
      !r.measurementName.startsWith("Bản vẽ thông số") &&
      (r.measurementValue || r.tolerance || (r.sizeLabel && r.sizeLabel !== "FULL")),
  );

  if (realRows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-gray-800 dark:bg-gray-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200/80 bg-gray-50/70 text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
          <tr>
            <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
              Size
            </th>
            <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider">
              Vị trí đo / Thông số
            </th>
            <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-right">
              Giá trị (cm)
            </th>
            <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-right">
              Dung sai
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
          {realRows.map((row, idx) => (
            <tr
              key={row.id || idx}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <td className="px-5 py-3.5 font-bold text-base text-gray-900 dark:text-white">
                {row.sizeLabel}
              </td>
              <td className="px-5 py-3.5 font-medium text-sm text-gray-800 dark:text-gray-200">
                {row.measurementName}
              </td>
              <td className="px-5 py-3.5 font-mono text-right text-base font-bold text-gray-900 dark:text-white">
                {row.measurementValue ? `${row.measurementValue} cm` : "—"}
              </td>
              <td className="px-5 py-3.5 text-right font-mono text-sm text-gray-500 dark:text-gray-400">
                {row.tolerance || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
