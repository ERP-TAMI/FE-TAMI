export type DocumentLibraryFilter = "all" | "processing" | "assigned";

type DocumentLibraryStatusFilterProps = {
  value: DocumentLibraryFilter;
  onChange: (filter: DocumentLibraryFilter) => void;
};

export function DocumentLibraryStatusFilter({ value, onChange }: DocumentLibraryStatusFilterProps) {
  return (
    <div className="flex items-center">
      <label className="sr-only" htmlFor="document-library-status">
        Trạng thái tài liệu
      </label>
      <select
        id="document-library-status"
        aria-label="Trạng thái tài liệu"
        value={value}
        onChange={(event) => onChange(event.target.value as DocumentLibraryFilter)}
        className="focus:border-brand-300 focus:ring-brand-100 dark:focus:ring-brand-950 h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 transition-colors outline-none focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        <option value="all">Trạng thái: tất cả</option>
        <option value="processing">Đang xử lý</option>
        <option value="assigned">Đã gán</option>
      </select>
    </div>
  );
}
