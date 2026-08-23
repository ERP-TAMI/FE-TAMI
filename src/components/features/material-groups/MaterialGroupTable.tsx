import { PencilIcon, TrashBinIcon } from "@/icons";
import type { MaterialGroup } from "@/types/material-group";

type MaterialGroupTableProps = {
  materialGroups: MaterialGroup[];
  togglingId?: string;
  onEdit: (materialGroup: MaterialGroup) => void;
  onToggleStatus: (materialGroup: MaterialGroup) => void;
  onDelete: (materialGroup: MaterialGroup) => void;
};

export function MaterialGroupTable({
  materialGroups,
  togglingId,
  onEdit,
  onToggleStatus,
  onDelete,
}: MaterialGroupTableProps) {
  if (materialGroups.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Không tìm thấy nhóm vật tư phù hợp.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left text-sm text-gray-700 dark:text-gray-200">
        <thead className="border-b border-gray-200 bg-gray-50/80 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-400">
          <tr>
            <th className="w-[45%] px-5 py-3.5 font-semibold">Tên nhóm</th>
            <th className="w-[25%] px-5 py-3.5 font-semibold">Trạng thái</th>
            <th className="w-[30%] px-5 py-3.5 text-center font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {materialGroups.map((group) => {
            const isToggling = togglingId === group.id;
            return (
              <tr
                key={group.id}
                className="group h-16 transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
              >
                <td className="w-[45%] truncate px-5 py-4">
                  <span
                    title={group.name}
                    className="block max-w-full truncate font-medium text-gray-900 dark:text-white"
                  >
                    {group.name}
                  </span>
                </td>
                <td className="w-[25%] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(group)}
                      disabled={isToggling}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        group.status === "active"
                          ? "bg-success-500"
                          : "bg-gray-300 dark:bg-gray-700"
                      } ${isToggling ? "opacity-50" : ""}`}
                      title={
                        group.status === "active"
                          ? "Đang hoạt động (Bấm để ngừng hoạt động)"
                          : "Đang ngừng hoạt động (Bấm để kích hoạt)"
                      }
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          group.status === "active" ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        group.status === "active"
                          ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {group.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </span>
                  </div>
                </td>
                <td className="w-[30%] px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(group)}
                      title="Chỉnh sửa"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <PencilIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(group)}
                      title="Xóa nhóm vật tư"
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
                    >
                      <TrashBinIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
