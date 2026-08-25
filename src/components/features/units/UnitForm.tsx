import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal } from "@/components/shared";
import type { UnitInput } from "@/api/unit.api";
import type { ApiError } from "@/lib/apiError";
import type { Unit } from "@/types/material";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên đơn vị là bắt buộc")
    .max(100, "Tên đơn vị không được vượt quá 100 ký tự"),
});

type FormValues = z.infer<typeof schema>;

type UnitFormProps = {
  mode: "create" | "edit";
  unit?: Unit;
  isSubmitting: boolean;
  serverError?: ApiError;
  onClose: () => void;
  onSubmit: (input: UnitInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function UnitForm({
  mode,
  unit,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: UnitFormProps) {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: unit ? { name: unit.name } : { name: "" },
  });

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);
  const closeWithWarning = () => {
    if (!formState.isDirty || window.confirm("Bạn có muốn hủy các thay đổi chưa lưu không?"))
      onClose();
  };

  const submit = (values: FormValues) => {
    onSubmit({ name: values.name });
  };

  return (
    <Modal
      open
      title={mode === "create" ? "Tạo đơn vị tính" : "Chỉnh sửa đơn vị tính"}
      closeLabel="Đóng biểu mẫu"
      onClose={closeWithWarning}
      footer={
        <>
          <Button variant="outline" onClick={closeWithWarning}>
            Hủy
          </Button>
          <Button form="unit-form" type="submit" loading={isSubmitting}>
            Lưu đơn vị tính
          </Button>
        </>
      }
    >
      <form id="unit-form" className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        {serverError && (
          <Alert variant="error" title="Không thể lưu đơn vị tính">
            {serverError.message}
          </Alert>
        )}
        <Input
          label="Tên đơn vị"
          placeholder="Ví dụ: Mét, Cuộn, Cái"
          error={formState.errors.name?.message}
          {...register("name")}
        />
      </form>
    </Modal>
  );
}
