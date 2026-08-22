import { Button } from "@/components/shared";
import { PlusIcon } from "@/icons";

type MaterialGroupPageHeaderProps = {
  onCreate: () => void;
};

export function MaterialGroupPageHeader({ onCreate }: MaterialGroupPageHeaderProps) {
  return (
    <>
      <nav
        aria-label="Điều hướng phân cấp"
        className="text-theme-xs flex items-center gap-2 text-gray-500 dark:text-gray-400"
      >
        <span>Danh mục</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-medium text-gray-700 dark:text-gray-200">
          Nhóm vật tư
        </span>
      </nav>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 id="page-title" className="text-title-md font-semibold text-gray-900 dark:text-white">
            Nhóm vật tư
          </h1>
          <p className="text-theme-sm mt-2 text-gray-500 dark:text-gray-400">
            Quản lý và sắp xếp các nhóm dùng để phân loại vật tư trong hệ thống.
          </p>
        </div>
        <Button onClick={onCreate}>
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Tạo nhóm vật tư mới
        </Button>
      </div>
    </>
  );
}
