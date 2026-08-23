import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert, Button, Input } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { authApi } from "@/api/auth.api";
import { getApiError, type ApiError } from "@/lib/apiError";
import { useAuthStore } from "@/store/authStore";

const schema = z.object({
  email: z.string().trim().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu là bắt buộc"),
});

type FormValues = z.infer<typeof schema>;

const LOGIN_ERROR_OVERRIDES: Record<string, string> = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
};

const NETWORK_ERROR_MESSAGE =
  "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";

type LocationState = { from?: { pathname: string } };

// TODO: remove before this reaches a shared branch — test-only convenience
// default so login doesn't need retyping credentials on every reload.
const DEV_DEFAULT_VALUES: FormValues = {
  email: "sa@tami.test",
  password: "123456",
};

export default function LoginPage() {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEV_DEFAULT_VALUES,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<ApiError>();
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";

  const submit = async (values: FormValues) => {
    setServerError(undefined);
    setIsSubmitting(true);
    try {
      const result = await authApi.login(values.email, values.password);
      setSession(result.user, result.accessToken);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(getApiError(error, NETWORK_ERROR_MESSAGE, LOGIN_ERROR_OVERRIDES));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta title="Đăng nhập | TAMI ERP" description="Đăng nhập vào hệ thống TAMI ERP" />
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
        <section className="shadow-theme-sm w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-8">
            <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
              TAMI ERP
            </p>
            <h1 className="text-title-sm mt-2 font-semibold text-gray-900 dark:text-white">
              Đăng nhập
            </h1>
            <p className="text-theme-sm mt-2 text-gray-500 dark:text-gray-400">
              Đăng nhập để tiếp tục vào hệ thống.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
            {serverError && (
              <Alert variant="error" title="Không thể đăng nhập">
                {serverError.message}
              </Alert>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={formState.errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              error={formState.errors.password?.message}
              {...register("password")}
            />
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Đăng nhập
            </Button>
          </form>
        </section>
      </main>
    </>
  );
}
