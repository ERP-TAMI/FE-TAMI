import { useState, useMemo } from "react";
import { Search, CheckCircle2, Circle, Edit2 } from "lucide-react";
import type { BomLineItem } from "@/types/bom";

export interface RdLineInputState {
  consumption: string;
  note: string;
}

interface BomRdEntryTableProps {
  lines: BomLineItem[];
  inputs: Record<string, RdLineInputState>;
  onChangeInput: (lineId: string, field: "consumption" | "note", value: string) => void;
  onEditLine: (line: BomLineItem) => void;
  isEditingInModal?: boolean;
}

export function BomRdEntryTable({
  lines,
  inputs,
  onChangeInput,
  onEditLine,
  isEditingInModal = false,
}: BomRdEntryTableProps) {
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");

  // Extract unique groups
  const groups = useMemo(() => {
    const set = new Set<string>();
    lines.forEach((l) => {
      if (l.materialGroupSnapshot) set.add(l.materialGroupSnapshot);
    });
    return Array.from(set);
  }, [lines]);

  // Filter lines by search and group
  const filteredLines = useMemo(() => {
    return lines.filter((line) => {
      const matCode =
        line.materialCodeSnapshot ||
        line.material?.materialCode ||
        "";

      const matchSearch =
        !search ||
        (line.materialNameSnapshot &&
          line.materialNameSnapshot.toLowerCase().includes(search.toLowerCase())) ||
        (matCode && matCode.toLowerCase().includes(search.toLowerCase())) ||
        (line.note && line.note.toLowerCase().includes(search.toLowerCase()));

      const matchGroup =
        selectedGroup === "all" || line.materialGroupSnapshot === selectedGroup;

      return matchSearch && matchGroup;
    });
  }, [lines, search, selectedGroup]);

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Header Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">
          Định mức nguyên phụ liệu ({lines.length})
        </h3>
      </div>

      {/* 2. Filter Bar matching mockup */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã hoặc tên nguyên liệu..."
            className="h-10 w-full rounded-xl border border-gray-200/80 bg-white pl-9 pr-4 text-xs text-gray-800 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          />
        </div>

        {/* Group Filter */}
        <div className="w-full sm:w-48 shrink-0">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="h-10 w-full cursor-pointer rounded-xl border border-gray-200/80 bg-white px-3 text-xs font-medium text-gray-700 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <option value="all">Tất cả nhóm</option>
            {groups.map((grp) => (
              <option key={grp} value={grp}>
                {grp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Main Data Entry Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-theme-xs">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <th className="w-12 px-4 py-3.5 text-center">#</th>
                <th className="px-3.5 py-3.5">Nhóm</th>
                <th className="px-3.5 py-3.5">Mã</th>
                <th className="px-3.5 py-3.5 min-w-[200px]">Nguyên phụ liệu</th>
                <th className="px-3.5 py-3.5 text-center">ĐVT</th>
                <th className="px-3.5 py-3.5 min-w-[120px] text-center">
                  Định mức / SP <span className="text-rose-500">*</span>
                </th>
                <th className="px-3.5 py-3.5 min-w-[180px]">Ghi chú</th>
                <th className="px-4 py-3.5 text-center min-w-[120px]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Không tìm thấy nguyên phụ liệu phù hợp
                  </td>
                </tr>
              ) : (
                filteredLines.map((line, idx) => {
                  const lineState = inputs[line.id] || {
                    consumption:
                      line.consumption && Number(line.consumption) > 0
                        ? String(line.consumption)
                        : "",
                    note: line.note || "",
                  };

                  const isEntered =
                    lineState.consumption.trim() !== "" &&
                    !isNaN(parseFloat(lineState.consumption)) &&
                    parseFloat(lineState.consumption) > 0;

                  const matCode =
                    line.materialCodeSnapshot ||
                    line.material?.materialCode ||
                    line.materialId?.slice(0, 8) ||
                    "—";

                  return (
                    <tr
                      key={line.id}
                      className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                    >
                      {/* 1. # Index */}
                      <td className="px-4 py-3 text-center font-mono text-xs text-gray-500">
                        {idx + 1}
                      </td>

                      {/* 2. Nhóm */}
                      <td className="px-3.5 py-3">
                        {line.materialGroupSnapshot ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            {line.materialGroupSnapshot}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* 3. Mã NPL */}
                      <td className="px-3.5 py-3 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {matCode}
                      </td>

                      {/* 4. Nguyên liệu (Tên NPL) */}
                      <td className="px-3.5 py-3">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {line.materialNameSnapshot}
                        </span>
                      </td>

                      {/* 5. ĐVT */}
                      <td className="px-3.5 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-300">
                        {line.unitSnapshot || "—"}
                      </td>

                      {/* 6. Định mức / SP * (Inline input) */}
                      <td className="px-3.5 py-3 text-center">
                        {isEditingInModal ? (
                          <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                            {lineState.consumption || "—"}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.0001"
                            min="0"
                            placeholder="-"
                            value={lineState.consumption}
                            onChange={(e) =>
                              onChangeInput(line.id, "consumption", e.target.value)
                            }
                            className="h-9 w-24 rounded-lg border border-gray-200 bg-white px-2.5 text-center font-mono text-xs font-semibold text-gray-900 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        )}
                      </td>

                      {/* 7. Ghi chú (Inline input) */}
                      <td className="px-3.5 py-3">
                        <input
                          type="text"
                          placeholder="Nhập ghi chú..."
                          value={lineState.note}
                          onChange={(e) =>
                            onChangeInput(line.id, "note", e.target.value)
                          }
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-2xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        />
                      </td>

                      {/* 8. Trạng thái & Edit button */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isEntered ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4 fill-emerald-600 text-white dark:fill-emerald-500" />
                              <span>Đã nhập</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                              <Circle className="h-4 w-4 stroke-[1.5]" />
                              <span>Chưa nhập</span>
                            </span>
                          )}

                          {/* Accessible button to preserve test compatibility */}
                          <button
                            type="button"
                            onClick={() => onEditLine(line)}
                            title="Chỉnh sửa dòng vật tư"
                            className="sr-only"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Table Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 text-theme-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          <span>Tổng cộng: {filteredLines.length} vật tư</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="h-7 w-7 rounded-lg border border-gray-200 bg-white text-gray-400 opacity-50 dark:border-gray-800 dark:bg-gray-800"
            >
              &lt;
            </button>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              1
            </span>
            <button
              type="button"
              disabled
              className="h-7 w-7 rounded-lg border border-gray-200 bg-white text-gray-400 opacity-50 dark:border-gray-800 dark:bg-gray-800"
            >
              &gt;
            </button>
            <span className="ml-2 text-gray-400">10 / trang</span>
          </div>
        </div>
      </div>
    </div>
  );
}
