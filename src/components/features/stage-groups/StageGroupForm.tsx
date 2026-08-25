import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import { STAGE_SSV_PATTERN, type Stage } from "@/types/stage";
import type { StageGroup, StageGroupInput } from "@/types/stage-group";
import { StageGroupItemEditor, type StageGroupStageOption } from "./StageGroupItemEditor";

const schema = z.object({
  groupCode: z.string().trim().max(50, "Mã nhóm không được vượt quá 50 ký tự"),
  groupName: z
    .string()
    .trim()
    .min(1, "Tên nhóm là bắt buộc")
    .max(255, "Tên nhóm không được vượt quá 255 ký tự"),
  description: z.string().trim(),
  items: z
    .array(
      z.object({
        stageId: z.string().uuid(),
        ssv: z
          .string()
          .trim()
          .regex(STAGE_SSV_PATTERN, "SSV phải là số không âm và có tối đa 3 số thập phân"),
      }),
    )
    .min(1, "Nhóm phải có ít nhất một công đoạn"),
});

type FormValues = z.infer<typeof schema>;
type StageGroupFormProps = {
  mode: "create" | "edit";
  group?: StageGroup;
  stages: Stage[];
  isSubmitting: boolean;
  serverError?: ApiError;
  stageOptionsError?: string;
  onClose: () => void;
  onSubmit: (input: StageGroupInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function StageGroupForm({
  mode,
  group,
  stages,
  isSubmitting,
  serverError,
  stageOptionsError,
  onClose,
  onSubmit,
  onDirtyChange,
}: StageGroupFormProps) {
  const [selectedStageId, setSelectedStageId] = useState("");
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
            .map((item) => ({ stageId: item.stageId, ssv: item.ssv })),
        }
      : { groupCode: "", groupName: "", description: "", items: [] },
  });
  const { fields, append, move, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);

  const stagesById = useMemo(() => {
    const options = new Map<string, StageGroupStageOption>();
    for (const item of group?.items ?? []) {
      options.set(item.stageId, {
        id: item.stageId,
        stageCode: item.stageCode,
        stageName: item.stageName,
        description: item.description,
        ssv: item.ssv,
        isInactive: true,
      });
    }
    for (const stage of stages) {
      options.set(stage.id, {
        id: stage.id,
        stageCode: stage.stageCode,
        stageName: stage.stageName,
        description: stage.description,
        ssv: stage.ssv,
      });
    }
    return options;
  }, [group?.items, stages]);
  const selectedIds = new Set(watchedItems.map((item) => item.stageId));
  const availableStages = stages
    .filter((stage) => !selectedIds.has(stage.id))
    .map((stage) => stagesById.get(stage.id)!);

  const addStage = () => {
    if (!selectedStageId || selectedIds.has(selectedStageId)) return;
    append({ stageId: selectedStageId, ssv: stagesById.get(selectedStageId)!.ssv });
    setSelectedStageId("");
  };
  const submit = (values: FormValues) => {
    const groupCode = values.groupCode?.trim().toUpperCase();
    onSubmit({
      ...(mode === "create" && groupCode ? { groupCode } : {}),
      groupName: values.groupName,
      description: values.description || null,
      items: values.items.map((item, orderIndex) => ({ ...item, orderIndex })),
    });
  };
  const itemSsvErrors = Array.isArray(formState.errors.items)
    ? formState.errors.items.map((item) => item?.ssv?.message)
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
        {stageOptionsError && (
          <Alert variant="error" title="Không thể tải danh sách công đoạn">
            {stageOptionsError}
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
            fieldId: field.id,
            stageId: watchedItems[index]?.stageId ?? field.stageId,
            ssv: watchedItems[index]?.ssv ?? field.ssv,
          }))}
          stagesById={stagesById}
          availableStages={availableStages}
          selectedStageId={selectedStageId}
          error={formState.errors.items?.root?.message ?? formState.errors.items?.message}
          ssvErrors={itemSsvErrors}
          onSelectedStageChange={setSelectedStageId}
          onAdd={addStage}
          onMove={move}
          onStageChange={(index, stageId) => {
            setValue(`items.${index}.stageId`, stageId, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue(`items.${index}.ssv`, stagesById.get(stageId)!.ssv, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onSsvChange={(index, ssv) =>
            setValue(`items.${index}.ssv`, ssv, {
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
