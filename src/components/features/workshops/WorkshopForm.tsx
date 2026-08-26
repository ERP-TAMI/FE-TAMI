import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, CodeLockToggle, ConfirmDialog, Input, Modal } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import {
  WORKSHOP_CAPACITY_MAX,
  type CreateWorkshopInput,
  type UpdateWorkshopInput,
  type Workshop,
} from "@/types/workshop";

const schema = z.object({
  workshopCode: z
    .string()
    .trim()
    .min(1, "Mã xưởng là bắt buộc")
    .max(50, "Mã xưởng không được vượt quá 50 ký tự"),
  name: z
    .string()
    .trim()
    .min(1, "Tên xưởng là bắt buộc")
    .max(255, "Tên xưởng không được vượt quá 255 ký tự"),
  manager: z.string().trim().max(200, "Người quản lý không được vượt quá 200 ký tự"),
  location: z.string().trim().max(255, "Vị trí không được vượt quá 255 ký tự"),
  capacity: z
    .string()
    .trim()
    .refine(
      (value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)),
      "Công suất phải là số nguyên không âm",
    )
    .refine(
      (value) => !/^\d+$/.test(value) || Number(value) <= WORKSHOP_CAPACITY_MAX,
      "Công suất phải từ 0 đến 2.147.483.647",
    ),
});

type FormValues = z.infer<typeof schema>;

type WorkshopFormProps = {
  mode: "create" | "edit";
  workshop?: Workshop;
  isSubmitting: boolean;
  serverError?: ApiError;
  onClose: () => void;
  onSubmit: (input: CreateWorkshopInput | UpdateWorkshopInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function WorkshopForm({
  mode,
  workshop,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: WorkshopFormProps) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [isCodeLocked, setIsCodeLocked] = useState(mode === "edit");
  const { register, handleSubmit, formState, setFocus } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      workshopCode: workshop?.workshopCode ?? "",
      name: workshop?.name ?? "",
      manager: workshop?.manager ?? "",
      location: workshop?.location ?? "",
      capacity: String(workshop?.capacity ?? 0),
    },
  });

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);
  useEffect(() => {
    if (mode === "edit" && !isCodeLocked) setFocus("workshopCode");
  }, [isCodeLocked, mode, setFocus]);

  const requestClose = () => {
    if (formState.isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onClose();
  };

  const submit = (values: FormValues) => {
    const mutableFields: UpdateWorkshopInput = {
      name: values.name.trim(),
      manager: values.manager.trim() || null,
      location: values.location.trim() || null,
      capacity: Number(values.capacity),
    };
    onSubmit({ ...mutableFields, workshopCode: values.workshopCode.trim().toUpperCase() });
  };

  return (
    <>
      <Modal
        open={!discardDialogOpen}
        title={mode === "create" ? "Tạo xưởng sản xuất" : "Chỉnh sửa xưởng sản xuất"}
        closeLabel="Đóng biểu mẫu"
        onClose={requestClose}
        footer={
          <>
            <Button variant="outline" onClick={requestClose}>
              Hủy
            </Button>
            <Button form="workshop-form" type="submit" loading={isSubmitting}>
              {mode === "create" ? "Tạo xưởng" : "Lưu xưởng"}
            </Button>
          </>
        }
      >
        <form id="workshop-form" className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          {serverError && (
            <Alert variant="error" title="Không thể lưu xưởng sản xuất">
              {serverError.message}
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Mã xưởng"
              labelAction={
                mode === "edit" ? (
                  <CodeLockToggle
                    codeLabel="mã xưởng"
                    isLocked={isCodeLocked}
                    onToggle={() => setIsCodeLocked((current) => !current)}
                  />
                ) : undefined
              }
              placeholder="Ví dụ: X-01"
              disabled={mode === "edit" && isCodeLocked}
              hint={
                mode === "edit"
                  ? isCodeLocked
                    ? "Nhấn biểu tượng khóa để chỉnh sửa mã xưởng."
                    : "Mã xưởng đang mở khóa và có thể chỉnh sửa."
                  : undefined
              }
              className={
                mode === "edit" && isCodeLocked
                  ? "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-100 dark:disabled:bg-gray-800/80 dark:disabled:text-gray-400"
                  : undefined
              }
              error={formState.errors.workshopCode?.message}
              {...register("workshopCode")}
            />
            <Input
              label="Tên xưởng"
              placeholder="Ví dụ: Xưởng May 1"
              error={formState.errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Người quản lý"
              placeholder="Tên quản đốc hoặc người phụ trách"
              error={formState.errors.manager?.message}
              {...register("manager")}
            />
            <Input
              label="Vị trí"
              placeholder="Ví dụ: Tầng 1 - Khu A"
              error={formState.errors.location?.message}
              {...register("location")}
            />
            <Input
              label="Công suất/ngày"
              type="number"
              inputMode="numeric"
              min="0"
              max={WORKSHOP_CAPACITY_MAX}
              step="1"
              placeholder="0"
              error={formState.errors.capacity?.message}
              {...register("capacity")}
            />
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={discardDialogOpen}
        title="Hủy các thay đổi?"
        description="Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onClose={() => setDiscardDialogOpen(false)}
        onConfirm={onClose}
      />
    </>
  );
}
