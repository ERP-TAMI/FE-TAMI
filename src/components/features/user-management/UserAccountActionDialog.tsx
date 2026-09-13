import { useState, type FormEvent } from "react";
import { Alert, Button, Modal } from "@/components/shared";
import type { UserListItem } from "@/types/user-management";

export type UserAccountAction = "lock" | "unlock" | "disable" | "reactivate" | "reset";

const content: Record<
  UserAccountAction,
  {
    title: string;
    confirm: string;
    description: string;
    danger?: boolean;
    requiresReason?: boolean;
  }
> = {
  lock: {
    title: "Khóa tài khoản",
    confirm: "Khóa tài khoản",
    description: "Người dùng sẽ bị đăng xuất và không thể đăng nhập cho đến khi được mở khóa.",
    danger: true,
    requiresReason: true,
  },
  unlock: {
    title: "Mở khóa tài khoản",
    confirm: "Mở khóa",
    description: "Người dùng có thể đăng nhập lại ngay sau khi tài khoản được mở khóa.",
  },
  disable: {
    title: "Vô hiệu hóa tài khoản",
    confirm: "Vô hiệu hóa",
    description:
      "Người dùng sẽ bị đăng xuất và không thể đăng nhập cho đến khi được kích hoạt lại.",
    danger: true,
    requiresReason: true,
  },
  reactivate: {
    title: "Kích hoạt lại tài khoản",
    confirm: "Kích hoạt lại",
    description: "Tài khoản sẽ trở lại trạng thái hoạt động.",
  },
  reset: {
    title: "Đặt lại mật khẩu",
    confirm: "Gửi link đặt lại",
    description:
      "Mật khẩu hiện tại và tất cả phiên đăng nhập sẽ bị thu hồi ngay. Hệ thống sẽ gửi link đặt mật khẩu dùng một lần, có hiệu lực 24 giờ.",
    danger: true,
  },
};

export function UserAccountActionDialog({
  action,
  user,
  isSubmitting,
  serverError,
  onClose,
  onConfirm,
}: {
  action: UserAccountAction;
  user: UserListItem;
  isSubmitting: boolean;
  serverError?: string;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const copy = content[action];
  const sendsReasonByEmail = action === "lock" || action === "disable";
  const reasonHelpId = sendsReasonByEmail ? "account-action-reason-help" : undefined;
  const reasonErrorId = reasonError ? "account-action-reason-error" : undefined;
  const reasonDescriptionIds = [reasonHelpId, reasonErrorId].filter(Boolean).join(" ");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedReason = reason.trim();
    if (copy.requiresReason && !normalizedReason) {
      setReasonError("Lý do là bắt buộc.");
      return;
    }
    onConfirm(copy.requiresReason ? normalizedReason : undefined);
  };

  return (
    <Modal
      open
      size="sm"
      title={copy.title}
      closeLabel={`Đóng hộp thoại ${copy.title.toLowerCase()}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            form="user-account-action-form"
            type="submit"
            variant={copy.danger ? "danger" : "primary"}
            loading={isSubmitting}
          >
            {copy.confirm}
          </Button>
        </>
      }
    >
      <form id="user-account-action-form" className="space-y-4" onSubmit={submit}>
        <p className="text-theme-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-white">{user.fullName}</span>
          {" — "}
          {user.email}
        </p>
        <p className="text-theme-sm text-gray-600 dark:text-gray-300">{copy.description}</p>
        {serverError && (
          <Alert variant="error" title="Không thể thực hiện thao tác">
            {serverError}
          </Alert>
        )}
        {copy.requiresReason && (
          <div>
            <label
              htmlFor="account-action-reason"
              className="text-theme-sm mb-1.5 block font-medium text-gray-700 dark:text-gray-300"
            >
              Lý do {action === "lock" ? "khóa tài khoản" : "vô hiệu hóa"}
              <span className="text-error-500"> *</span>
            </label>
            <textarea
              id="account-action-reason"
              aria-label={`Lý do ${action === "lock" ? "khóa tài khoản" : "vô hiệu hóa"}`}
              rows={4}
              maxLength={500}
              value={reason}
              aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonDescriptionIds || undefined}
              className="focus:border-brand-300 focus:ring-brand-500/10 w-full resize-y rounded-lg border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:ring-3 dark:border-gray-700 dark:text-white"
              onChange={(event) => {
                setReason(event.target.value);
                if (reasonError) setReasonError(undefined);
              }}
            />
            {sendsReasonByEmail && (
              <p id="account-action-reason-help" className="mt-1 text-xs text-gray-500">
                Lý do này sẽ được gửi tới email của người dùng.
              </p>
            )}
            {reasonError && (
              <p id="account-action-reason-error" className="text-error-500 mt-1 text-xs">
                {reasonError}
              </p>
            )}
            <p className="mt-1 text-right text-xs text-gray-400">{reason.length}/500</p>
          </div>
        )}
      </form>
    </Modal>
  );
}
