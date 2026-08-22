import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal } from "@/components/shared";
import type { MaterialGroup, MaterialGroupInput } from "../types/material-group.types";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên nhóm là bắt buộc")
    .max(150, "Tên nhóm không được vượt quá 150 ký tự"),
  displayOrder: z
    .number()
    .int("Thứ tự hiển thị phải là số nguyên")
    .min(0, "Thứ tự hiển thị không được âm"),
});

type FormValues = z.infer<typeof schema>;

type MaterialGroupFormProps = {
  mode: "create" | "edit";
  materialGroup?: MaterialGroup;
  isSubmitting: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: MaterialGroupInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function MaterialGroupForm({
  mode,
  materialGroup,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: MaterialGroupFormProps) {
  const { register, handleSubmit, setError, formState } = useForm<FormValues>({
    defaultValues: materialGroup
      ? {
          name: materialGroup.name,
          displayOrder: materialGroup.displayOrder,
        }
      : { name: "", displayOrder: 0 },
  });

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);
  useEffect(() => {
    if (/name|tên nhóm/i.test(serverError ?? "")) setError("name", { message: serverError });
  }, [serverError, setError]);
  const hasFieldError = Boolean(serverError && /name|tên nhóm/i.test(serverError));

  const closeWithWarning = () => {
    if (!formState.isDirty || window.confirm("Bạn có muốn hủy các thay đổi chưa lưu không?"))
      onClose();
  };

  const submit = (values: FormValues) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues)
        setError(issue.path[0] as keyof FormValues, { message: issue.message });
      return;
    }
    onSubmit(result.data);
  };

  return (
    <Modal
      open
      title={mode === "create" ? "Tạo nhóm vật tư" : "Chỉnh sửa nhóm vật tư"}
      closeLabel="Đóng biểu mẫu"
      onClose={closeWithWarning}
      footer={
        <>
          <Button variant="outline" onClick={closeWithWarning}>
            Hủy
          </Button>
          <Button form="material-group-form" type="submit" loading={isSubmitting}>
            Lưu nhóm vật tư
          </Button>
        </>
      }
    >
      <form
        id="material-group-form"
        className="space-y-5"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        {serverError && !hasFieldError && (
          <Alert variant="error" title="Không thể lưu nhóm vật tư">
            {serverError}
          </Alert>
        )}
        <Input
          label="Tên nhóm"
          placeholder="Ví dụ: Vải chính, Phụ liệu"
          error={formState.errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Thứ tự hiển thị"
          type="number"
          min="0"
          step="1"
          hint="Số nhỏ hơn sẽ được hiển thị trước."
          error={formState.errors.displayOrder?.message}
          {...register("displayOrder", { valueAsNumber: true })}
        />
      </form>
    </Modal>
  );
}
