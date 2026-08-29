import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, ConfirmDialog, Input, Modal } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import type { CreateSizeChartInput, SizeChart, UpdateSizeChartInput } from "@/types/size-chart";
import { findDuplicateSize, normalizeSizeChartText, parseSizeLabels } from "./sizeChartForm.utils";
import { SizeChipInput } from "./SizeChipInput";

function collectSizeLabels(sizes: string[], sizeDraft: string): string[] {
  return [...sizes, ...parseSizeLabels(sizeDraft)];
}

const schema = z
  .object({
    name: z
      .string()
      .refine((value) => normalizeSizeChartText(value).length > 0, "Tên bảng Size là bắt buộc")
      .refine(
        (value) => normalizeSizeChartText(value).length <= 100,
        "Tên bảng Size không được vượt quá 100 ký tự",
      ),
    sizes: z.array(z.string()),
    sizeDraft: z.string(),
  })
  .superRefine(({ sizes, sizeDraft }, context) => {
    const labels = collectSizeLabels(sizes, sizeDraft);
    if (labels.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sizes"],
        message: "Cần thêm ít nhất một Size",
      });
      return;
    }
    const tooLong = labels.find((label) => label.length > 30);
    if (tooLong) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sizes"],
        message: `Size "${tooLong}" không được vượt quá 30 ký tự`,
      });
    }
    const duplicate = findDuplicateSize(labels);
    if (duplicate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sizes"],
        message: `Size "${duplicate}" đã tồn tại`,
      });
    }
  });

type FormValues = z.infer<typeof schema>;

type SizeChartFormProps = {
  mode: "create" | "edit";
  sizeChart?: SizeChart;
  isSubmitting: boolean;
  serverError?: ApiError;
  onClose: () => void;
  onSubmit: (input: CreateSizeChartInput | UpdateSizeChartInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function SizeChartForm({
  mode,
  sizeChart,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: SizeChartFormProps) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const { register, control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: sizeChart?.name ?? "",
      sizes: sizeChart?.sizes ?? [],
      sizeDraft: "",
    },
  });
  const { field: sizesField } = useController({ name: "sizes", control });
  const { field: sizeDraftField } = useController({ name: "sizeDraft", control });

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);

  const requestClose = () => {
    if (formState.isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onClose();
  };

  const submit = (values: FormValues) => {
    onSubmit({
      name: normalizeSizeChartText(values.name),
      sizes: collectSizeLabels(values.sizes, values.sizeDraft),
    });
  };

  const sizesError = formState.errors.sizes?.message;

  return (
    <>
      <Modal
        open={!discardDialogOpen}
        title={mode === "create" ? "Tạo bảng Size" : "Chỉnh sửa bảng Size"}
        closeLabel="Đóng biểu mẫu"
        onClose={requestClose}
        footer={
          <>
            <Button variant="outline" onClick={requestClose}>
              Hủy
            </Button>
            <Button form="size-chart-form" type="submit" loading={isSubmitting}>
              {mode === "create" ? "Tạo bảng Size" : "Lưu bảng Size"}
            </Button>
          </>
        }
      >
        <form id="size-chart-form" className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          {serverError && (
            <Alert variant="error" title="Không thể lưu bảng Size">
              {serverError.message}
            </Alert>
          )}
          <Input
            label="Tên bảng Size"
            placeholder="Ví dụ: Áo sơ mi nam"
            error={formState.errors.name?.message}
            {...register("name")}
          />
          <SizeChipInput
            id="size-chart-sizes"
            labels={sizesField.value}
            draft={sizeDraftField.value}
            error={sizesError}
            disabled={isSubmitting}
            onLabelsChange={sizesField.onChange}
            onDraftChange={sizeDraftField.onChange}
          />
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
