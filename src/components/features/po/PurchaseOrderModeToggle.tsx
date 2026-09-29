import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";

export function PurchaseOrderModeToggle() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const mutation = useMutation({
    mutationFn: authApi.updatePurchaseOrderMode,
    onSuccess: updateUser,
  });

  if (!user || user.roleCode !== "SA") return null;

  const isFullAccess = user.purchaseOrderMode === "FULL_ACCESS";

  return (
    <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
      <span className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
        Chế độ PO:
      </span>
      <span
        className={`text-theme-xs font-medium ${
          isFullAccess ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"
        }`}
      >
        Chỉ xem
      </span>
      <button
        type="button"
        role="switch"
        aria-label="Chế độ chỉnh sửa PO"
        aria-checked={isFullAccess}
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate(isFullAccess ? "READ_ONLY" : "FULL_ACCESS")
        }
        className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-wait disabled:opacity-60 ${
          isFullAccess
            ? "bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
            : "bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            isFullAccess ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span
        className={`text-theme-xs font-medium ${
          isFullAccess ? "text-brand-700 dark:text-brand-300" : "text-gray-500 dark:text-gray-400"
        }`}
      >
        Toàn quyền
      </span>
      {mutation.isError && (
        <span role="alert" className="text-theme-xs text-error-600 dark:text-error-400">
          Không thể cập nhật chế độ PO. Hãy thử lại.
        </span>
      )}
    </div>
  );
}
