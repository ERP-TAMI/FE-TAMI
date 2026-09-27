import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { authApi } from "@/api/auth.api";
import { Alert, Button, Input } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { getApiError } from "@/lib/apiError";

const schema = z.object({
  email: z.string().trim().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
});
type FormValues = z.infer<typeof schema>;

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_NOT_FOUND: "Email này chưa tồn tại trong hệ thống.",
  ACCOUNT_NOT_AVAILABLE_FOR_PASSWORD_RESET:
    "Tài khoản của bạn đang bị tạm khóa hoặc đã bị vô hiệu hóa. Vui lòng liên hệ IT/Admin.",
  PASSWORD_RESET_REQUEST_TOO_SOON: "Vui lòng chờ một phút trước khi yêu cầu email mới.",
};

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string>();
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const submit = async (values: FormValues) => {
    setServerError("");
    setSubmitting(true);
    try {
      await authApi.requestPasswordReset(values.email);
      setSubmittedEmail(values.email);
    } catch (error) {
      setServerError(
        getApiError(error, "Không thể gửi email. Vui lòng thử lại.", ERROR_MESSAGES).message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title="Quên mật khẩu | TAMI ERP" description="Yêu cầu đặt lại mật khẩu" />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <section className="shadow-theme-sm w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
            TAMI ERP
          </p>
          <h1 className="text-title-sm mt-2 font-semibold text-gray-900 dark:text-white">
            Quên mật khẩu
          </h1>
          <p className="text-theme-sm mt-2 text-gray-500 dark:text-gray-400">
            Nhập email tài khoản để nhận liên kết đặt lại mật khẩu.
          </p>

          {submittedEmail ? (
            <div className="mt-6 space-y-4">
              <Alert variant="success" title="Yêu cầu đã được ghi nhận">
                Hệ thống đang gửi liên kết đặt lại mật khẩu tới {submittedEmail}. Liên kết có
                hiệu lực trong 24 giờ.
              </Alert>
              <Link className="text-theme-sm text-brand-600 hover:underline" to="/login">
                Về trang đăng nhập
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
              {serverError && (
                <Alert variant="error" title="Không thể gửi email">
                  {serverError}
                </Alert>
              )}
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={formState.errors.email?.message}
                {...register("email")}
              />
              <Button type="submit" className="w-full" loading={submitting}>
                Gửi liên kết đặt lại
              </Button>
              <div className="text-center">
                <Link className="text-theme-sm text-brand-600 hover:underline" to="/login">
                  Về trang đăng nhập
                </Link>
              </div>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
