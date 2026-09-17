import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { ChangePasswordInput } from "@/api/auth.api";
import { Alert, Button, Modal } from "@/components/shared";
import { EyeCloseIcon, EyeIcon } from "@/icons";
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

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, error, hint, disabled, id, ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-theme-sm block font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={show ? "text" : "password"}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`text-theme-sm h-11 w-full rounded-lg border bg-transparent px-4 pr-11 text-gray-900 transition outline-none placeholder:text-gray-400 focus:ring-3 dark:text-white ${
            error
              ? "border-error-500 focus:border-error-500 focus:ring-error-500/10"
              : "focus:border-brand-500 focus:ring-brand-500/10 border-gray-200 dark:border-gray-700"
          }`}
          {...props}
        />
        <button
          type="button"
          aria-pressed={show}
          aria-label={show ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
          disabled={disabled}
          onClick={() => setShow((current) => !current)}
          className="focus:ring-brand-500/20 absolute top-1/2 right-2.5 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:ring-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          {show ? (
            <EyeIcon aria-hidden="true" className="h-5 w-5 fill-current" />
          ) : (
            <EyeCloseIcon aria-hidden="true" className="h-5 w-5 fill-current" />
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-theme-xs text-error-500" role="alert">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="text-theme-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
});

type ChangePasswordModalProps = {
  open: boolean;
  isSubmitting: boolean;
  serverError?: ApiError;
  onSubmit: (input: ChangePasswordInput) => Promise<boolean>;
  onClose: () => void;
};

export function ChangePasswordModal({
  open,
  isSubmitting,
  serverError,
  onSubmit,
  onClose,
}: ChangePasswordModalProps) {
  const currentPasswordRef = useRef<HTMLInputElement | null>(null);
  const { register, handleSubmit, formState, reset } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmation: "" },
  });

  const currentPasswordField = register("currentPassword");

  useEffect(() => {
    if (open) {
      reset();
      const timer = setTimeout(() => {
        currentPasswordRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, reset]);

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    const succeeded = await onSubmit({ currentPassword, newPassword });
    if (succeeded) {
      reset();
      onClose();
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Đổi mật khẩu tài khoản"
      onClose={handleClose}
      closeDisabled={isSubmitting}
      size="md"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
            Yêu cầu mật khẩu
          </p>
          <p className="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
            Mật khẩu mới phải có tối thiểu 8 ký tự và khác mật khẩu hiện tại.
          </p>
        </div>

        {serverError && (
          <Alert variant="error" title="Không thể đổi mật khẩu">
            {serverError.message}
          </Alert>
        )}

        <PasswordField
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu đang sử dụng"
          error={formState.errors.currentPassword?.message}
          disabled={isSubmitting}
          {...currentPasswordField}
          ref={(element) => {
            currentPasswordField.ref(element);
            currentPasswordRef.current = element;
          }}
        />

        <PasswordField
          label="Mật khẩu mới"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          hint="Từ 8 đến 72 ký tự."
          error={formState.errors.newPassword?.message}
          disabled={isSubmitting}
          {...register("newPassword")}
        />

        <PasswordField
          label="Xác nhận mật khẩu mới"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu mới"
          error={formState.errors.confirmation?.message}
          disabled={isSubmitting}
          {...register("confirmation")}
        />

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={handleClose}
            className="cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            className="cursor-pointer"
          >
            Cập nhật mật khẩu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
