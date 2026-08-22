type MaterialGroupOverviewProps = {
  total: number;
  active: number;
  inactive: number;
};

const items = [
  {
    key: "total",
    label: "Tổng số nhóm vật tư",
    helper: "Dữ liệu danh mục",
    dotClass: "bg-brand-500",
  },
  {
    key: "active",
    label: "Nhóm đang hoạt động",
    helper: "Có thể sử dụng",
    dotClass: "bg-success-500",
  },
  {
    key: "inactive",
    label: "Nhóm ngừng hoạt động",
    helper: "Tạm ngừng sử dụng",
    dotClass: "bg-gray-400",
  },
] as const;

export function MaterialGroupOverview({ total, active, inactive }: MaterialGroupOverviewProps) {
  const values = { total, active, inactive };

  return (
    <section
      aria-label="Tổng quan nhóm vật tư"
      className="shadow-theme-xs grid overflow-hidden rounded-xl border border-gray-200 bg-white sm:grid-cols-3 dark:border-gray-800 dark:bg-gray-900"
    >
      {items.map((item, index) => (
        <article
          key={item.key}
          aria-label={item.label}
          className={`px-5 py-5 sm:px-6 ${
            index === 0
              ? ""
              : "border-t border-gray-200 sm:border-t-0 sm:border-l dark:border-gray-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${item.dotClass}`} />
            <p className="text-theme-sm font-medium text-gray-600 dark:text-gray-300">
              {item.label}
            </p>
          </div>
          <p className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">
            {values[item.key]}
          </p>
          <p className="text-theme-xs mt-1 text-gray-400 dark:text-gray-500">{item.helper}</p>
        </article>
      ))}
    </section>
  );
}
