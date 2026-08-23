import { Button } from "@/components/shared";
import { AngleLeftIcon, AngleRightIcon } from "@/icons";

type MaterialGroupPaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getVisiblePages(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sortedPages = [...pages]
    .filter((item) => item > 0 && item <= totalPages)
    .sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  sortedPages.forEach((item, index) => {
    if (index > 0 && item - sortedPages[index - 1] > 1) result.push("ellipsis");
    result.push(item);
  });
  return result;
}

export function MaterialGroupPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}: MaterialGroupPaginationProps) {
  if (totalItems === 0) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const pages = getVisiblePages(page, totalPages);

  return (
    <footer className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800">
      <p className="text-theme-sm text-gray-500 dark:text-gray-400">
        Hiển thị {firstItem}–{lastItem} trên {totalItems} nhóm vật tư
      </p>

      <nav
        aria-label="Phân trang nhóm vật tư"
        className="flex items-center justify-between gap-2 sm:justify-end"
      >
        <Button
          variant="outline"
          size="sm"
          aria-label="Trang trước"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <AngleLeftIcon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Trước</span>
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-400" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-label={`Trang ${item}`}
                aria-current={page === item ? "page" : undefined}
                onClick={() => onPageChange(item)}
                className={`text-theme-sm focus:ring-brand-500/20 h-9 min-w-9 rounded-lg px-2 font-medium transition focus:ring-3 focus:outline-none ${
                  page === item
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>
        <span className="text-theme-sm text-gray-600 sm:hidden dark:text-gray-300">
          Trang {page}/{totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          aria-label="Trang sau"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="hidden sm:inline">Sau</span>
          <AngleRightIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </nav>
    </footer>
  );
}
