import { useState, type FormEvent } from "react";
import { Alert, Button, Input, Modal } from "@/components/shared";
import type { UserListItem } from "@/types/user-management";

export type UserAccountAction =
  | "lock"
  | "unlock"
  | "reset"
  | "resend-lock-email"
  | "deactivate"
  | "delete";

type ActionSubmission = string | { temporaryPassword: string } | undefined;

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
  reset: {
    title: "Đặt mật khẩu tạm",
    confirm: "Đặt mật khẩu và gửi email",
    description:
      "Mật khẩu hiện tại và các phiên đăng nhập sẽ bị thu hồi. Mật khẩu tạm được gửi đến email đăng ký; người dùng phải đổi mật khẩu sau khi đăng nhập.",
    danger: true,
  },
  "resend-lock-email": {
    title: "Gửi lại email khóa tài khoản",
    confirm: "Gửi lại email",
    description:
      "Hệ thống sẽ gửi lại thông báo khóa tài khoản. Vui lòng nhập lại lý do để nội dung email và lịch sử thao tác được rõ ràng.",
    requiresReason: true,
  },
  deactivate: {
    title: "Vô hiệu hóa tài khoản",
    confirm: "Vô hiệu hóa",
    description:
      "Người dùng sẽ bị đăng xuất, không thể đăng nhập và sẽ không còn xuất hiện trong danh sách đang hoạt động. Bạn vẫn có thể xóa tài khoản đã vô hiệu hóa sau đó.",
    danger: true,
  },
  delete: {
    title: "Xóa người dùng",
    confirm: "Xóa người dùng",
    description:
      "Thao tác này xóa vĩnh viễn tài khoản đã vô hiệu hóa. Hệ thống sẽ từ chối nếu còn dữ liệu nghiệp vụ tham chiếu tài khoản.",
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
  onConfirm: (submission?: ActionSubmission) => void;
}) {
  const [reason, setReason] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [validationError, setValidationError] = useState<string>();
  const copy = content[action];
  const sendsReasonByEmail = action === "lock" || action === "resend-lock-email";

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (copy.requiresReason && !reason.trim()) {
      setValidationError("Lý do là bắt buộc.");
      return;
    }
    if (action === "reset") {
      if (temporaryPassword.length < 8 || temporaryPassword.length > 72) {
        setValidationError("Mật khẩu tạm phải có từ 8 đến 72 ký tự.");
        return;
      }
      if (temporaryPassword !== passwordConfirmation) {
        setValidationError("Mật khẩu xác nhận không khớp.");
        return;
      }
      onConfirm({ temporaryPassword });
      return;
    }
    onConfirm(copy.requiresReason ? reason.trim() : undefined);
  };

  return (
    <Modal
      open
      size="sm"
      title={copy.title}
      closeLabel={`Đóng hộp thoại ${copy.title.toLowerCase()}`}
      onClose={onClose}
      closeDisabled={isSubmitting}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            form="user-account-action-form"
            type="submit"
            variant={copy.danger ? "danger" : "primary"}
            loading={isSubmitting}
            className="cursor-pointer"
          >
            {copy.confirm}
          </Button>
        </>
      }
    >
      <form id="user-account-action-form" className="space-y-4" onSubmit={submit} noValidate>
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
        {action === "reset" && (
          <div className="space-y-4">
            <Input
              label="Mật khẩu tạm"
              type="password"
              autoComplete="new-password"
              value={temporaryPassword}
              minLength={8}
              maxLength={72}
              required
              disabled={isSubmitting}
              hint="Từ 8 đến 72 ký tự. Mật khẩu này sẽ được gửi qua email và không hiển thị lại sau khi gửi."
              onChange={(event) => {
                setTemporaryPassword(event.target.value);
                if (validationError) setValidationError(undefined);
              }}
            />
            <Input
              label="Xác nhận mật khẩu tạm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirmation}
              maxLength={72}
              required
              disabled={isSubmitting}
              onChange={(event) => {
                setPasswordConfirmation(event.target.value);
                if (validationError) setValidationError(undefined);
              }}
            />
          </div>
        )}
        {copy.requiresReason && (
          <div>
            <label
              htmlFor="account-action-reason"
              className="text-theme-sm mb-1.5 block font-medium text-gray-700 dark:text-gray-300"
            >
              Lý do khóa tài khoản
              <span className="text-error-500"> *</span>
            </label>
            <textarea
              id="account-action-reason"
              aria-label="Lý do khóa tài khoản"
              rows={4}
              maxLength={500}
              value={reason}
              aria-invalid={Boolean(validationError)}
              className="focus:border-brand-300 focus:ring-brand-500/10 w-full resize-y rounded-lg border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:ring-3 dark:border-gray-700 dark:text-white"
              onChange={(event) => {
                setReason(event.target.value);
                if (validationError) setValidationError(undefined);
              }}
            />
            {sendsReasonByEmail && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Lý do này sẽ được gửi tới email của người dùng.
              </p>
            )}
            <p className="mt-1 text-right text-xs text-gray-400">{reason.length}/500</p>
          </div>
        )}
        {validationError && (
          <p className="text-error-500 text-theme-xs" role="alert">
            {validationError}
          </p>
        )}
      </form>
    </Modal>
  );
}
