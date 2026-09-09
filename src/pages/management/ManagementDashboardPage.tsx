import PageMeta from "@/components/shared/PageMeta";

export default function ManagementDashboardPage() {
  return (
    <section className="space-y-4">
      <PageMeta title="Dashboard quản lý | TAMI ERP" description="Khu Quản lý TAMI ERP" />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard quản lý</h1>
      <p className="max-w-2xl text-gray-600 dark:text-gray-400">
        Chào mừng bạn đến khu Quản lý. Bạn có thể chuyển sang hệ thống nhân viên từ menu tài khoản
        để tiếp tục công việc.
      </p>
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="font-medium text-gray-900 dark:text-white">Báo cáo quản lý</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Các chỉ số tổng hợp sẽ được bổ sung trong bản cập nhật tiếp theo.
        </p>
      </div>
    </section>
  );
}
