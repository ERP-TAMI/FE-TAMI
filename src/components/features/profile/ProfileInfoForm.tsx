import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { UpdateProfileInput } from "@/api/auth.api";
import { Alert, Button, Input } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import type { AuthUser } from "@/store/authStore";

const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên là bắt buộc").max(200),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || /^[0-9+().\s-]{6,20}$/.test(value), "Số điện thoại không hợp lệ"),
});

type ProfileValues = z.infer<typeof profileSchema>;

type ProfileInfoFormProps = {
  user: AuthUser;
  isSubmitting: boolean;
  serverError?: ApiError;
  onSubmit: (input: UpdateProfileInput) => Promise<void>;
};

export function ProfileInfoForm({
  user,
  isSubmitting,
  serverError,
  onSubmit,
}: ProfileInfoFormProps) {
  const { register, handleSubmit, formState, reset } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { fullName: user.fullName, phone: user.phone ?? "" },
  });

  const submit = handleSubmit(async (values) => {
    const input = { fullName: values.fullName, phone: values.phone || null };
    await onSubmit(input);
    reset({ fullName: input.fullName, phone: input.phone ?? "" });
  });

  return (
    <form className="space-y-5" onSubmit={(event) => void submit(event)} noValidate>
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
          error={formState.errors.phone?.message}
          disabled={isSubmitting}
          {...register("phone")}
        />
      </div>
      <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
        <Button type="submit" loading={isSubmitting} disabled={!formState.isDirty}>
          Lưu thay đổi
        </Button>
      </div>
    </form>
  );
}
