import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { UpdateProfileInput } from "@/api/auth.api";
import { Alert, Button, Input, Modal } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import type { AuthUser } from "@/store/authStore";

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên là bắt buộc").max(200),
  phone: z
    .string()
    .trim()
    .max(20, "Số điện thoại không hợp lệ")
    .refine((value) => {
      if (!value) return true;
      if (!/^\+?[0-9().\s-]+$/.test(value)) return false;

      const digits = value.replace(/\D/g, "");
      return digits.length >= 9 && digits.length <= 15 && !/^(\d)\1+$/.test(digits);
    }, "Số điện thoại không hợp lệ"),
});

type ProfileValues = z.infer<typeof profileSchema>;

type EditProfileModalProps = {
  open: boolean;
  user: AuthUser;
  isSubmitting: boolean;
  serverError?: ApiError;
  onSubmit: (input: UpdateProfileInput) => Promise<boolean>;
  onClose: () => void;
};

export function EditProfileModal({
  open,
  user,
  isSubmitting,
  serverError,
  onSubmit,
  onClose,
}: EditProfileModalProps) {
  const { register, handleSubmit, formState, reset } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { fullName: user.fullName, phone: user.phone ?? "" },
  });

  useEffect(() => {
    if (open) {
      reset({ fullName: user.fullName, phone: user.phone ?? "" });
    }
  }, [open, user, reset]);

  const submit = handleSubmit(async (values) => {
    const input = { fullName: values.fullName, phone: values.phone || null };
    const succeeded = await onSubmit(input);
    if (succeeded) {
      reset({ fullName: input.fullName, phone: input.phone ?? "" });
      onClose();
    }
  });

  const handleClose = () => {
    reset({ fullName: user.fullName, phone: user.phone ?? "" });
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Chỉnh sửa thông tin cá nhân"
      onClose={handleClose}
      closeDisabled={isSubmitting}
      size="lg"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-theme-sm font-medium text-gray-900 dark:text-white">
            Quy định cập nhật thông tin
          </p>
          <p className="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
            Bạn có thể cập nhật Họ và tên và Số điện thoại liên hệ. Địa chỉ email ({user.email}) và Vai trò ({user.roleName}) được bảo vệ và quản lý bởi Quản trị viên hệ thống.
          </p>
        </div>

        {serverError && (
          <Alert variant="error" title="Không thể cập nhật thông tin">
            {serverError.message}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Họ và tên"
            autoComplete="name"
            error={formState.errors.fullName?.message}
            disabled={isSubmitting}
            {...register("fullName")}
          />
          <Input
            label="Số điện thoại"
            autoComplete="tel"
            placeholder="Ví dụ: 0905123456"
            error={formState.errors.phone?.message}
            disabled={isSubmitting}
            {...register("phone")}
          />
          <Input
            label="Địa chỉ email"
            type="email"
            value={user.email}
            disabled
            readOnly
            hint="Email tài khoản do Quản trị viên cấp, không thể tự chỉnh sửa."
            className="cursor-not-allowed bg-gray-50 text-gray-500 disabled:opacity-100 dark:bg-gray-800/60 dark:text-gray-400"
          />
          <Input
            label="Vai trò"
            value={user.roleName}
            disabled
            readOnly
            hint="Vai trò và quyền hạn do Quản trị viên hệ thống quản lý."
            className="cursor-not-allowed bg-gray-50 text-gray-500 disabled:opacity-100 dark:bg-gray-800/60 dark:text-gray-400"
          />
        </div>

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
            disabled={!formState.isDirty}
            className="cursor-pointer"
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
