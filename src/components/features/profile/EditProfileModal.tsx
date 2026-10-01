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
      title="Chỉnh sửa hồ sơ"
      subtitle="Cập nhật họ tên và số điện thoại liên hệ."
      onClose={handleClose}
      closeDisabled={isSubmitting}
      size="lg"
    >
      <form
        className="space-y-5"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
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
