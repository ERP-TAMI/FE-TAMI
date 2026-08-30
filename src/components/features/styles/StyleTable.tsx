import { Link } from "react-router-dom";
import { Table, type TableColumn } from "@/components/shared/Table";
import { StyleStatusBadge } from "@/components/features/styles/StyleStatusBadge";
import { EyeIcon, PencilIcon, TrashBinIcon } from "@/icons";
import type { Style } from "@/types/style";

type StyleTableProps = {
  styles: Style[];
  togglingId?: string;
  loading?: boolean;
  onToggleStatus: (style: Style) => void;
  onEdit: (style: Style) => void;
  onDelete: (style: Style) => void;
};

export function StyleTable({
  styles,
  togglingId,
  loading = false,
  onToggleStatus,
  onEdit,
  onDelete,
}: StyleTableProps) {
  const columns: TableColumn<Style>[] = [
    {
      key: "styleCode",
      header: "Mã mẫu",
      width: "w-[16%]",
      render: (style) => (
        <Link
          to={`/styles/${style.id}/detail`}
          title={style.styleCode}
          className="text-brand-600 dark:text-brand-400 block max-w-full truncate font-mono text-sm font-semibold hover:underline"
        >
          {style.styleCode}
        </Link>
      ),
    },
    {
      key: "styleName",
      header: "Tên mẫu",
      width: "w-[23%]",
      render: (style) => (
        <span
          title={style.styleName}
          className="block max-w-full truncate font-medium text-gray-900 dark:text-white"
        >
          {style.styleName}
        </span>
      ),
    },
    {
      key: "category",
      header: "Dòng sản phẩm",
      width: "w-[16%]",
      render: (style) => (
        <span className="block max-w-full truncate text-gray-600 dark:text-gray-300">
          {style.category || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      width: "w-[16%]",
      render: (style) => {
        const isToggling = togglingId === style.id;
        return (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onToggleStatus(style)}
              disabled={isToggling}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                style.status === "active" ? "bg-success-500" : "bg-gray-300 dark:bg-gray-700"
              } ${isToggling ? "opacity-50" : ""}`}
              title={
                style.status === "active"
                  ? "Đang Hoạt động (Bấm để chuyển thành Nháp)"
                  : "Đang Nháp (Bấm để chuyển thành Hoạt động)"
              }
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                  style.status === "active" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <StyleStatusBadge status={style.status} showDot={false} />
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      width: "w-[12%]",
      render: (style) => (
        <span className="text-theme-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
          {new Date(style.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      width: "w-[17%]",
      align: "center",
      render: (style) => (
        <div className="flex items-center justify-center gap-1">
          <Link
            to={`/styles/${style.id}/detail`}
            title="Xem chi tiết"
            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/60 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
          >
            <EyeIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Xem</span>
          </Link>
          <button
            type="button"
            onClick={() => onEdit(style)}
            title="Chỉnh sửa"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <PencilIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(style)}
            title="Xóa mẫu Fit"
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/60 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            <TrashBinIcon className="h-3.5 w-3.5 shrink-0" />
            <span>Xóa</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      rows={styles}
      getRowKey={(style) => style.id}
      loading={loading}
      emptyMessage="Không tìm thấy Mẫu Fit nào."
    />
  );
}
