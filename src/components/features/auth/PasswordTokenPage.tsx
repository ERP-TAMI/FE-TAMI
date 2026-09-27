import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
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

export function PasswordTokenPage({
  pageTitle,
  heading,
  submitLabel,
  successTitle,
  successMessage,
  tokenMessages,
  validateToken,
  complete,
}: {
  pageTitle: string;
  heading: string;
  submitLabel: string;
  successTitle: string;
  successMessage: string;
  tokenMessages: Record<string, string>;
  validateToken: (token: string) => Promise<{ valid: true; expiresAt: string }>;
  complete: (token: string, password: string) => Promise<void>;
}) {
  const [token] = useState(
    () => new URLSearchParams(window.location.search).get("token") ?? "",
  );
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
      setMessage(tokenMessages.INVALID);
      setState("invalid");
      return;
    }
    void validateToken(token)
      .then(() => setState("ready"))
      .catch((error) => {
        setMessage(getApiError(error, tokenMessages.INVALID, tokenMessages).message);
        setState("invalid");
      });
  }, [token, tokenMessages, validateToken]);

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    setMessage("");
    try {
      await complete(token, values.password);
      setState("success");
    } catch (error) {
      const apiError = getApiError(
        error,
        "Không thể đặt mật khẩu. Vui lòng thử lại.",
        tokenMessages,
      );
      setMessage(apiError.message);
      if (tokenMessages[apiError.code]) setState("invalid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title={`${pageTitle} | TAMI ERP`} description={pageTitle} />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <section className="shadow-theme-sm w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
            TAMI ERP
          </p>
          <h1 className="text-title-sm mt-2 font-semibold text-gray-900 dark:text-white">
            {heading}
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
              <Alert variant="success" title={successTitle}>
                {successMessage}
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
                    className="text-theme-xs text-brand-600 hover:underline dark:text-brand-400"
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
                {submitLabel}
              </Button>
            </form>
          )}
        </section>
      </main>
    </>
  );
}
