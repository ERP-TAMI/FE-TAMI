import { Table, type TableColumn } from "@/components/shared/Table";
import { LockIcon, PencilIcon, TrashBinIcon } from "@/icons";
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
      key: "code",
      header: "Mã vật tư",
      width: "w-[10%]",
      render: (item) => (
        <button
          type="button"
          onClick={() => onView(item)}
          title={item.materialCode}
          className="hover:text-brand-600 dark:hover:text-brand-400 block max-w-full truncate text-left font-medium text-gray-900 dark:text-white"
        >
          {item.materialCode}
        </button>
      ),
    },
    {
      key: "name",
      header: "Tên vật tư",
      width: "w-[26%]",
      render: (item) => (
        <button
          type="button"
          onClick={() => onView(item)}
          title={item.materialName}
          className="hover:text-brand-600 dark:hover:text-brand-400 line-clamp-2 max-w-full text-left"
        >
          {item.materialName}
        </button>
      ),
    },
    {
      key: "group",
      header: "Nhóm vật tư",
      width: "w-[16%]",
      render: (item) => item.materialGroupName ?? "—",
    },
    { key: "unit", header: "ĐVT", width: "w-[8%]", render: (item) => item.defaultUnitName ?? "—" },
    {
      key: "yield",
      header: "Yield (%)",
      width: "w-[10%]",
      align: "right",
      render: (item) => `${displayDecimal(item.defaultYieldPct)}%`,
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[30%]",
      align: "center",
      render: (item) => {
        const pending = togglingId === item.id;
        return (
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(item)}
              title="Chỉnh sửa"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <PencilIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Sửa</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleStatus(item)}
              disabled={pending}
              title={item.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                item.status === "active"
                  ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                  : "border-success-200 bg-success-50/60 text-success-700 hover:bg-success-100 dark:border-success-900/40 dark:bg-success-950/40 dark:text-success-300 dark:hover:bg-success-900/60"
              }`}
            >
              <LockIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.status === "active" ? "Khóa" : "Mở khóa"}</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              title="Xóa vật tư"
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
            >
              <TrashBinIcon className="h-3.5 w-3.5 shrink-0" />
              <span>Xóa</span>
            </button>
          </div>
        );
      },
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
