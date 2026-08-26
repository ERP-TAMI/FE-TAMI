import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, CodeLockToggle, ConfirmDialog, Input, Modal } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import { STAGE_SSV_PATTERN, type Stage, type StageInput } from "@/types/stage";

const schema = z.object({
  stageCode: z.string().trim().max(50, "Mã công đoạn không được vượt quá 50 ký tự"),
  stageName: z
    .string()
    .trim()
    .min(1, "Tên công đoạn là bắt buộc")
    .max(255, "Tên công đoạn không được vượt quá 255 ký tự"),
  description: z.string().trim(),
  ssv: z
    .string()
    .trim()
    .regex(STAGE_SSV_PATTERN, "SSV phải là số không âm, tối đa 3 chữ số thập phân"),
});
const editSchema = schema.extend({
  stageCode: z
    .string()
    .trim()
    .min(1, "Mã công đoạn là bắt buộc")
    .max(50, "Mã công đoạn không được vượt quá 50 ký tự"),
});

type FormValues = z.infer<typeof schema>;
type StageFormProps = {
  mode: "create" | "edit";
  stage?: Stage;
  isSubmitting: boolean;
  serverError?: ApiError;
  onClose: () => void;
  onSubmit: (input: StageInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function StageForm({
  mode,
  stage,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: StageFormProps) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [isCodeLocked, setIsCodeLocked] = useState(mode === "edit");
  const { register, handleSubmit, formState, setFocus } = useForm<FormValues>({
    resolver: zodResolver(mode === "edit" ? editSchema : schema),
    defaultValues: stage
      ? {
          stageCode: stage.stageCode,
          stageName: stage.stageName,
          description: stage.description ?? "",
          ssv: stage.ssv,
        }
      : { stageCode: "", stageName: "", description: "", ssv: "0" },
  });

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);
  useEffect(() => {
    if (mode === "edit" && !isCodeLocked) setFocus("stageCode");
  }, [isCodeLocked, mode, setFocus]);

  const requestClose = () => {
    if (formState.isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onClose();
  };
  const submit = (values: FormValues) => {
    const stageCode = values.stageCode.toUpperCase();
    onSubmit({
      ...(stageCode ? { stageCode } : {}),
      stageName: values.stageName,
      description: values.description || null,
      ssv: values.ssv,
    });
  };

  return (
    <>
      <Modal
        open={!discardDialogOpen}
        title={mode === "create" ? "Tạo công đoạn" : "Chỉnh sửa công đoạn"}
        closeLabel="Đóng biểu mẫu"
        onClose={requestClose}
        footer={
          <>
            <Button variant="outline" onClick={requestClose}>
              Hủy
            </Button>
            <Button form="stage-form" type="submit" loading={isSubmitting}>
              Lưu công đoạn
            </Button>
          </>
        }
      >
        <form id="stage-form" className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          {serverError && (
            <Alert variant="error" title="Không thể lưu công đoạn">
              {serverError.message}
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Mã công đoạn"
              labelAction={
                mode === "edit" ? (
                  <CodeLockToggle
                    codeLabel="mã công đoạn"
                    isLocked={isCodeLocked}
                    onToggle={() => setIsCodeLocked((current) => !current)}
                  />
                ) : undefined
              }
              placeholder="Ví dụ: GD-CAT"
              hint={
                mode === "create"
                  ? "Để trống để hệ thống tự tạo mã từ tên công đoạn."
                  : isCodeLocked
                    ? "Nhấn biểu tượng khóa để chỉnh sửa mã công đoạn."
                    : "Mã công đoạn đang mở khóa và có thể chỉnh sửa."
              }
              disabled={mode === "edit" && isCodeLocked}
              className={
                mode === "edit" && isCodeLocked
                  ? "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-100 dark:disabled:bg-gray-800/80 dark:disabled:text-gray-400"
                  : undefined
              }
              error={formState.errors.stageCode?.message}
              {...register("stageCode")}
            />
            <Input
              label="Tên công đoạn"
              placeholder="Ví dụ: Cắt vải"
              error={formState.errors.stageName?.message}
              {...register("stageName")}
            />
          </div>
          <Input
            label="SSV (giây/sản phẩm)"
            inputMode="decimal"
            placeholder="Ví dụ: 12.500"
            error={formState.errors.ssv?.message}
            {...register("ssv")}
          />
          <div className="space-y-2">
            <label
              htmlFor="stage-description"
              className="text-theme-sm block font-medium text-gray-700 dark:text-gray-300"
            >
              Mô tả
            </label>
            <textarea
              id="stage-description"
              rows={3}
              placeholder="Nhập mô tả chi tiết công đoạn"
              className="text-theme-sm focus:border-brand-500 focus:ring-brand-500/10 w-full resize-y rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-gray-900 outline-none focus:ring-3 dark:border-gray-700 dark:text-white"
              {...register("description")}
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
        onConfirm={() => onClose()}
      />
    </>
  );
}
