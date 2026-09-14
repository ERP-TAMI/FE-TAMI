import { useMemo } from "react";
import { authApi } from "@/api/auth.api";
import { PasswordTokenPage } from "@/components/features/auth/PasswordTokenPage";

export default function ResetPasswordPage() {
  const tokenMessages = useMemo(
    () => ({
      INVALID: "Liên kết đặt lại mật khẩu không hợp lệ.",
      PASSWORD_RESET_TOKEN_EXPIRED: "Liên kết đặt lại mật khẩu đã hết hạn.",
      PASSWORD_RESET_TOKEN_USED: "Liên kết đặt lại mật khẩu đã được sử dụng.",
      PASSWORD_RESET_TOKEN_REVOKED: "Liên kết đặt lại mật khẩu đã bị thu hồi.",
      PASSWORD_RESET_TOKEN_INVALID: "Liên kết đặt lại mật khẩu không hợp lệ.",
    }),
    [],
  );

  return (
    <PasswordTokenPage
      pageTitle="Đặt lại mật khẩu"
      heading="Đặt lại mật khẩu"
      submitLabel="Lưu mật khẩu mới"
      successTitle="Đã đặt lại mật khẩu"
      successMessage="Mật khẩu đã được thay đổi. Bạn có thể đăng nhập bằng mật khẩu mới."
      tokenMessages={tokenMessages}
      validateToken={authApi.validatePasswordReset}
      complete={authApi.completePasswordReset}
    />
  );
}
