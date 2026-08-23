import { Table, type TableColumn } from "@/components/shared/Table";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";
import type { Material } from "@/types/material";

type Props = {
  materials: Material[];
  togglingId?: string;
  loading?: boolean;
  onView: (material: Material) => void;
  onEdit: (material: Material) => void;
  onToggleStatus: (material: Material) => void;
  onDelete: (material: Material) => void;
};
function displayDecimal(value: string) {
  const [integer, fraction = ""] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const trimmed = fraction.replace(/0+$/, "");
  return trimmed ? `${grouped},${trimmed}` : grouped;
}

export function MaterialTable({
  materials,
  togglingId,
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: Props) {
  const columns: TableColumn<Material>[] = [
    {
      key: "material",
      header: "Vật tư",
      width: "w-[24%]",
      render: (item) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onView(item)}
            className="hover:text-brand-600 dark:hover:text-brand-400 block max-w-full truncate text-left font-medium text-gray-900 dark:text-white"
          >
            {item.materialName}
          </button>
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            {item.materialCode}
          </span>
        </div>
      ),
    },
    {
      key: "group",
      header: "Nhóm",
      width: "w-[14%]",
      render: (item) => item.materialGroupName ?? "—",
    },
    { key: "unit", header: "ĐVT", width: "w-[8%]", render: (item) => item.defaultUnitCode ?? "—" },
    {
      key: "stock",
      header: "Tồn kho",
      width: "w-[12%]",
      align: "right",
      render: (item) => displayDecimal(item.currentStock),
    },
    {
      key: "cost",
      header: "Đơn giá",
      width: "w-[14%]",
      align: "right",
      render: (item) => displayDecimal(item.lastUnitCost),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[14%]",
      render: (item) => {
        const pending = togglingId === item.id;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleStatus(item)}
              disabled={pending}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${item.status === "active" ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"} ${pending ? "opacity-50" : ""}`}
              title={item.status === "active" ? "Đang sử dụng (Bấm để tắt)" : "Đã tắt (Bấm để bật)"}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-xs transition ${item.status === "active" ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
            <span className="text-theme-xs whitespace-nowrap text-gray-600 dark:text-gray-300">
              {item.status === "active" ? "Đang dùng" : "Đã tắt"}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[14%]",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onView(item)}
            title="Xem chi tiết"
            aria-label="Xem chi tiết"
            className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <EyeIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(item)}
            title="Chỉnh sửa"
            aria-label="Chỉnh sửa"
            className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            title="Xóa vật tư"
            aria-label="Xóa vật tư"
            className="rounded-lg border border-red-200 bg-red-50/60 p-1.5 text-red-600 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
          >
            <TrashBinIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];
  return (
    <Table
      embedded
      tableClassName="min-w-[900px]"
      columns={columns}
      rows={materials}
      getRowKey={(item) => item.id}
      loading={loading}
      emptyMessage="Không tìm thấy vật tư phù hợp."
    />
  );
}
