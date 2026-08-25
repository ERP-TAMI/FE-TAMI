import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import { STAGE_SSV_PATTERN } from "@/types/stage";
import type { StageGroup, StageGroupInput } from "@/types/stage-group";
import { StageGroupItemEditor, type StageGroupItemFieldErrors } from "./StageGroupItemEditor";

const childSchema = z.object({
  id: z.string().uuid().optional(),
  itemName: z
    .string()
    .trim()
    .min(1, "Tên công đoạn con là bắt buộc")
    .max(255, "Tên công đoạn con không được vượt quá 255 ký tự"),
  description: z.string().trim(),
  ssv: z
    .string()
    .trim()
    .regex(STAGE_SSV_PATTERN, "SSV phải là số không âm và có tối đa 3 số thập phân"),
  status: z.enum(["active", "inactive"]),
});

const schema = z.object({
  groupCode: z.string().trim().max(50, "Mã nhóm không được vượt quá 50 ký tự"),
  groupName: z
    .string()
    .trim()
    .min(1, "Tên nhóm là bắt buộc")
    .max(255, "Tên nhóm không được vượt quá 255 ký tự"),
  description: z.string().trim(),
  items: z.array(childSchema).min(1, "Nhóm phải có ít nhất một công đoạn con"),
});

type FormValues = z.infer<typeof schema>;
type StageGroupFormProps = {
  mode: "create" | "edit";
  group?: StageGroup;
  isSubmitting: boolean;
  serverError?: ApiError;
  onClose: () => void;
  onSubmit: (input: StageGroupInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function StageGroupForm({
  mode,
  group,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: StageGroupFormProps) {
  const { control, register, handleSubmit, formState, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: group
      ? {
          groupCode: group.groupCode,
          groupName: group.groupName,
          description: group.description ?? "",
          items: group.items
            .slice()
            .sort((left, right) => left.orderIndex - right.orderIndex)
            .map((item) => ({
              id: item.id,
              itemName: item.itemName,
              description: item.description ?? "",
              ssv: item.ssv,
              status: item.status,
            })),
        }
      : { groupCode: "", groupName: "", description: "", items: [] },
  });
  const { fields, append, move, remove } = useFieldArray({
    control,
    name: "items",
    keyName: "fieldId",
  });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);

  const submit = (values: FormValues) => {
    const groupCode = values.groupCode.trim().toUpperCase();
    onSubmit({
      ...(mode === "create" && groupCode ? { groupCode } : {}),
      groupName: values.groupName,
      description: values.description || null,
      items: values.items.map((item, orderIndex) => ({
        ...(item.id ? { id: item.id } : {}),
        itemName: item.itemName,
        description: item.description || null,
        ssv: item.ssv,
        status: item.status,
        orderIndex,
      })),
    });
  };
  const itemErrors: StageGroupItemFieldErrors[] = Array.isArray(formState.errors.items)
    ? formState.errors.items.map((error) => ({
        itemName: error?.itemName?.message,
        description: error?.description?.message,
        ssv: error?.ssv?.message,
        status: error?.status?.message,
      }))
    : [];

  return (
    <Modal
      open
      size="2xl"
      title={mode === "create" ? "Tạo nhóm công đoạn" : "Chỉnh sửa nhóm công đoạn"}
      closeLabel="Đóng biểu mẫu nhóm công đoạn"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button form="stage-group-form" type="submit" loading={isSubmitting}>
            {mode === "create" ? "Tạo Nhóm Công Đoạn" : "Lưu nhóm công đoạn"}
          </Button>
        </>
      }
    >
      <form id="stage-group-form" className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        {serverError && (
          <Alert variant="error" title="Không thể lưu nhóm công đoạn">
            {serverError.message}
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Mã nhóm công đoạn"
            placeholder="Ví dụ: NS-NHOM-MAY"
            hint={
              mode === "create"
                ? "Để trống để hệ thống tự sinh mã từ tên nhóm công đoạn."
                : undefined
            }
            disabled={mode === "edit"}
            error={formState.errors.groupCode?.message}
            {...register("groupCode")}
          />
          <Input
            label="Tên nhóm công đoạn"
            placeholder="Ví dụ: Nhóm may"
            error={formState.errors.groupName?.message}
            {...register("groupName")}
          />
        </div>
        <Input
          label="Mô tả"
          placeholder="Mô tả ngắn về nhóm công đoạn"
          error={formState.errors.description?.message}
          {...register("description")}
        />
        <StageGroupItemEditor
          items={fields.map((field, index) => ({
            fieldId: field.fieldId,
            id: watchedItems[index]?.id ?? field.id,
            itemName: watchedItems[index]?.itemName ?? field.itemName,
            description: watchedItems[index]?.description ?? field.description,
            ssv: watchedItems[index]?.ssv ?? field.ssv,
            status: watchedItems[index]?.status ?? field.status,
          }))}
          error={formState.errors.items?.root?.message ?? formState.errors.items?.message}
          itemErrors={itemErrors}
          onAdd={() => append({ itemName: "", description: "", ssv: "10.000", status: "active" })}
          onMove={move}
          onChange={(index, field, value) =>
            setValue(`items.${index}.${field}`, value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          onRemove={remove}
        />
      </form>
    </Modal>
  );
}
