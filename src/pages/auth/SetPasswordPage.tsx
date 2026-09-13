import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { authApi } from "@/api/auth.api";
import { Alert, Button, Input } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { getApiError } from "@/lib/apiError";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(72, "Mật khẩu không được vượt quá 72 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại không khớp",
  });

type FormValues = z.infer<typeof schema>;
type PageState = "validating" | "ready" | "invalid" | "success";

const TOKEN_MESSAGES: Record<string, string> = {
  PASSWORD_SETUP_TOKEN_EXPIRED:
    "Liên kết đặt mật khẩu đã hết hạn. Hãy liên hệ quản trị viên để được gửi lại.",
  PASSWORD_SETUP_TOKEN_USED: "Liên kết đặt mật khẩu đã được sử dụng.",
  PASSWORD_SETUP_TOKEN_INVALID: "Liên kết đặt mật khẩu không hợp lệ.",
};

export default function SetPasswordPage() {
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") ?? "");
  const [state, setState] = useState<PageState>("validating");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
    if (!token) {
      setMessage(TOKEN_MESSAGES.PASSWORD_SETUP_TOKEN_INVALID);
      setState("invalid");
      return;
    }
    void authApi
      .validatePasswordSetup(token)
      .then(() => setState("ready"))
      .catch((error) => {
        const apiError = getApiError(
          error,
          TOKEN_MESSAGES.PASSWORD_SETUP_TOKEN_INVALID,
          TOKEN_MESSAGES,
        );
        setMessage(apiError.message);
        setState("invalid");
      });
  }, [token]);

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    setMessage("");
    try {
      await authApi.completePasswordSetup(token, values.password);
      setState("success");
    } catch (error) {
      const apiError = getApiError(
        error,
        "Không thể đặt mật khẩu. Vui lòng thử lại.",
        TOKEN_MESSAGES,
      );
      setMessage(apiError.message);
      if (apiError.code && TOKEN_MESSAGES[apiError.code]) setState("invalid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title="Đặt mật khẩu | TAMI ERP" description="Thiết lập mật khẩu tài khoản" />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <section className="shadow-theme-sm w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
            TAMI ERP
          </p>
          <h1 className="text-title-sm mt-2 font-semibold text-gray-900 dark:text-white">
            Đặt mật khẩu
          </h1>

          {state === "validating" && (
            <p role="status" className="mt-6 text-gray-500">
              Đang kiểm tra liên kết…
            </p>
          )}
          {state === "invalid" && (
            <div className="mt-6 space-y-4">
              <Alert variant="error" title="Không thể sử dụng liên kết">
                {message}
              </Alert>
              <Link className="text-theme-sm text-brand-600 hover:underline" to="/login">
                Về trang đăng nhập
              </Link>
            </div>
          )}
          {state === "success" && (
            <div className="mt-6 space-y-4">
              <Alert variant="success" title="Đã thiết lập mật khẩu">
                Bạn có thể đăng nhập nếu tài khoản đang hoạt động.
              </Alert>
              <Link className="text-theme-sm text-brand-600 hover:underline" to="/login">
                Đăng nhập
              </Link>
            </div>
          )}
          {state === "ready" && (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)} noValidate>
              {message && <Alert variant="error">{message}</Alert>}
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">
                Mật khẩu cần từ 8 đến 72 ký tự. Liên kết chỉ sử dụng được một lần.
              </p>
              <Input
                label="Mật khẩu mới"
                labelAction={
                  <button
                    type="button"
                    className="text-theme-xs text-brand-600 dark:text-brand-400 hover:underline"
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  </button>
                }
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                error={formState.errors.password?.message}
                {...register("password")}
              />
              <Input
                label="Nhập lại mật khẩu"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                error={formState.errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <Button type="submit" className="w-full" loading={submitting}>
                Đặt mật khẩu
              </Button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
