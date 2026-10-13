import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert, Button, Input } from "@/components/shared";
import { useProfile } from "@/hooks/useProfile";
import { getApiError, type ApiError } from "@/lib/apiError";
import { useAuthStore } from "@/store/authStore";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Nhập mật khẩu tạm trong email.").max(72),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự.")
      .max(72, "Mật khẩu mới không được quá 72 ký tự."),
    confirmation: z.string().min(1, "Vui lòng xác nhận mật khẩu mới.").max(72),
  })
  .superRefine((values, context) => {
    if (values.newPassword === values.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Mật khẩu mới phải khác mật khẩu tạm.",
      });
    }
    if (values.newPassword !== values.confirmation) {
      context.addIssue({
        code: "custom",
        path: ["confirmation"],
        message: "Mật khẩu xác nhận không khớp.",
      });
    }
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export default function ForcePasswordChangePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { changePassword } = useProfile();
  const [serverError, setServerError] = useState<ApiError>();
  const { register, handleSubmit, formState } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmation: "" },
  });

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setServerError(undefined);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      clearSession();
      queryClient.clear();
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (error) {
      setServerError(
        getApiError(error, "Không thể đổi mật khẩu. Vui lòng kiểm tra lại và thử tiếp.", {
          CURRENT_PASSWORD_INCORRECT: "Mật khẩu tạm không đúng.",
          PASSWORD_REUSE_NOT_ALLOWED: "Mật khẩu mới phải khác mật khẩu tạm.",
        }),
      );
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6">
      <section
        aria-labelledby="force-password-title"
        className="w-full max-w-xl space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-md dark:border-gray-800 dark:bg-gray-900 sm:p-9"
      >
        <header className="space-y-2">
          <p className="text-theme-xs font-semibold tracking-wide text-brand-600 dark:text-brand-400">
            BẢO MẬT TÀI KHOẢN
          </p>
          <h1 id="force-password-title" className="text-2xl font-semibold text-gray-900 dark:text-white">
            Đổi mật khẩu tạm
          </h1>
          <p className="text-theme-sm text-gray-600 dark:text-gray-300">
            Đây là lần đăng nhập bằng mật khẩu do quản trị viên cấp. Hãy tạo mật khẩu mới để tiếp
            tục sử dụng TAMI ERP.
          </p>
          {user && (
            <p className="text-theme-sm font-medium text-gray-800 dark:text-gray-200">{user.email}</p>
          )}
        </header>

        <Alert variant="info" title="Cần đổi mật khẩu để tiếp tục">
          Mật khẩu mới cần có từ 8 đến 72 ký tự và phải khác mật khẩu tạm.
        </Alert>

        {serverError && (
          <Alert variant="error" title="Không thể đổi mật khẩu">
            {serverError.message}
          </Alert>
        )}

        <form className="space-y-5" onSubmit={(event) => void submit(event)} noValidate>
          <Input
            label="Mật khẩu tạm"
            type="password"
            autoComplete="current-password"
            autoFocus
            disabled={changePassword.isPending}
            error={formState.errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            hint="Từ 8 đến 72 ký tự."
            disabled={changePassword.isPending}
            error={formState.errors.newPassword?.message}
            {...register("newPassword")}
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            autoComplete="new-password"
            disabled={changePassword.isPending}
            error={formState.errors.confirmation?.message}
            {...register("confirmation")}
          />
          <Button type="submit" loading={changePassword.isPending} className="w-full cursor-pointer">
            Đổi mật khẩu và tiếp tục
          </Button>
        </form>
      </section>
    </main>
  );
}
