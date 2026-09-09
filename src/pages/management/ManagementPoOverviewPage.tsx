import PageMeta from "@/components/shared/PageMeta";

export default function ManagementPoOverviewPage() {
  return (
    <section className="space-y-4">
      <PageMeta title="Tổng quan PO | TAMI ERP" description="Tổng quan đơn hàng dành cho quản lý" />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tổng quan PO</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="font-medium text-gray-900 dark:text-white">Theo dõi đơn hàng</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Báo cáo tổng quan PO sẽ được bổ sung trong bản cập nhật tiếp theo.
        </p>
      </div>
    </section>
  );
}
