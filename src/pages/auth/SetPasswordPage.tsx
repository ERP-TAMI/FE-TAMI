import { useMemo } from "react";
import { authApi } from "@/api/auth.api";
import { PasswordTokenPage } from "@/components/features/auth/PasswordTokenPage";

export default function SetPasswordPage() {
  const tokenMessages = useMemo(
    () => ({
      INVALID: "Liên kết đặt mật khẩu không hợp lệ.",
      PASSWORD_SETUP_TOKEN_EXPIRED:
        "Liên kết đặt mật khẩu đã hết hạn. Hãy liên hệ quản trị viên để được gửi lại.",
      PASSWORD_SETUP_TOKEN_USED: "Liên kết đặt mật khẩu đã được sử dụng.",
      PASSWORD_SETUP_TOKEN_REVOKED: "Liên kết đặt mật khẩu đã bị thu hồi.",
      PASSWORD_SETUP_TOKEN_INVALID: "Liên kết đặt mật khẩu không hợp lệ.",
    }),
    [],
  );

  return (
    <PasswordTokenPage
      pageTitle="Đặt mật khẩu"
      heading="Đặt mật khẩu"
      submitLabel="Đặt mật khẩu"
      successTitle="Đã thiết lập mật khẩu"
      successMessage="Bạn có thể đăng nhập nếu tài khoản đang hoạt động."
      tokenMessages={tokenMessages}
      validateToken={authApi.validatePasswordSetup}
      complete={authApi.completePasswordSetup}
    />
  );
}
