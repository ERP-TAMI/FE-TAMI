import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ChangePasswordInput } from "@/api/auth.api";
import { Alert, Button, Input } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc").max(72),
    newPassword: z
      .string()
      .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự")
      .max(72, "Mật khẩu mới không được quá 72 ký tự"),
    confirmation: z.string().min(1, "Vui lòng xác nhận mật khẩu mới").max(72),
  })
  .superRefine((values, context) => {
    if (values.newPassword === values.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
      });
    }
    if (values.confirmation !== values.newPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmation"],
        message: "Mật khẩu xác nhận không khớp",
      });
    }
  });

type PasswordValues = z.infer<typeof passwordSchema>;

type ChangePasswordFormProps = {
  isSubmitting: boolean;
  serverError?: ApiError;
  onSubmit: (input: ChangePasswordInput) => Promise<void>;
  onCancel?: () => void;
};

export function ChangePasswordForm({
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: ChangePasswordFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentPasswordRef = useRef<HTMLInputElement | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmation: "" },
  });
  const currentPasswordField = register("currentPassword");

  useEffect(() => {
    if (isOpen) currentPasswordRef.current?.focus();
  }, [isOpen]);

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    await onSubmit({ currentPassword, newPassword });
    reset();
    setIsOpen(false);
  });

  const cancel = () => {
    reset();
    setIsOpen(false);
    onCancel?.();
  };

  if (!isOpen) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
          <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
            Mật khẩu đã được thiết lập
          </p>
          <p className="text-theme-sm mt-1 text-gray-500 dark:text-gray-400">
            Bạn cần xác nhận mật khẩu hiện tại trước khi tạo mật khẩu mới.
          </p>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          aria-expanded="false"
          aria-controls="change-password-form"
          onClick={() => setIsOpen(true)}
        >
          Đổi mật khẩu
        </Button>
      </div>
    );
  }

  return (
    <form
      id="change-password-form"
      className="space-y-5"
      onSubmit={(event) => void submit(event)}
      noValidate
    >
      {serverError && (
        <Alert variant="error" title="Không thể đổi mật khẩu">
          {serverError.message}
        </Alert>
      )}
      <Input
        label="Mật khẩu hiện tại"
        type="password"
        autoComplete="current-password"
        error={formState.errors.currentPassword?.message}
        disabled={isSubmitting}
        {...currentPasswordField}
        ref={(element) => {
          currentPasswordField.ref(element);
          currentPasswordRef.current = element;
        }}
      />
      <Input
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        hint="Từ 8 đến 72 ký tự."
        error={formState.errors.newPassword?.message}
        disabled={isSubmitting}
        {...register("newPassword")}
      />
      <Input
        label="Xác nhận mật khẩu mới"
        type="password"
        autoComplete="new-password"
        error={formState.errors.confirmation?.message}
        disabled={isSubmitting}
        {...register("confirmation")}
      />
      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={cancel}>
          Hủy
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Đổi mật khẩu
        </Button>
      </div>
    </form>
  );
}
