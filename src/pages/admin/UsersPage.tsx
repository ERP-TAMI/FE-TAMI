import { Alert } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";

export default function UsersPage() {
  return (
    <>
      <PageMeta
        title="Quản trị người dùng | TAMI ERP"
        description="Khu vực quản trị người dùng TAMI ERP"
      />
      <section aria-labelledby="user-management-title" className="space-y-6">
        <div>
          <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
            Hệ thống
          </p>
          <h1
            id="user-management-title"
            className="text-title-md mt-2 font-semibold text-gray-900 dark:text-white"
          >
            Quản trị người dùng
          </h1>
          <p className="text-theme-sm mt-2 max-w-2xl text-gray-500 dark:text-gray-400">
            Quản lý tài khoản và quyền truy cập của người dùng trong hệ thống.
          </p>
        </div>
        <Alert title="Khu vực quản trị đã sẵn sàng">
          Các nghiệp vụ quản trị tài khoản sẽ được bổ sung trong task chức năng tiếp theo.
        </Alert>
      </section>
    </>
  );
}
