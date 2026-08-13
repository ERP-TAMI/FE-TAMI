import PageMeta from "@/components/shared/PageMeta";

type PlaceholderPageProps = {
  title: string;
  description: string;
  module: string;
};

export function PlaceholderPage({ title, description, module }: PlaceholderPageProps) {
  return (
    <>
      <PageMeta title={`${title} | TAMI ERP`} description={description} />
      <section aria-labelledby="page-title" className="space-y-6">
        <div>
          <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
            {module}
          </p>
          <h1
            id="page-title"
            className="text-title-md mt-2 font-semibold text-gray-900 dark:text-white"
          >
            {title}
          </h1>
          <p className="text-theme-sm mt-2 max-w-2xl text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div
          role="status"
          className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 dark:border-gray-700 dark:bg-gray-900"
        >
          <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
            Module foundation ready
          </p>
          <p className="text-theme-sm mt-2 text-gray-500 dark:text-gray-400">
            Business workflows will be added in a separate feature task.
          </p>
        </div>
      </section>
    </>
  );
}
