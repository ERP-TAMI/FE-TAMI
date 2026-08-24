import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, ConfirmDialog, Input, Modal } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import type { Stage } from "@/types/stage";
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
    .array(z.object({ stageId: z.string().uuid() }))
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
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const { control, register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: group
      ? {
          groupCode: group.groupCode,
          groupName: group.groupName,
          description: group.description ?? "",
          items: group.items
            .slice()
            .sort((left, right) => left.orderIndex - right.orderIndex)
            .map((item) => ({ stageId: item.stageId })),
        }
      : { groupCode: "", groupName: "", description: "", items: [] },
  });
  const { fields, append, move, remove, update } = useFieldArray({ control, name: "items" });

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
  const selectedIds = new Set(fields.map((field) => field.stageId));
  const availableStages = stages
    .filter((stage) => !selectedIds.has(stage.id))
    .map((stage) => stagesById.get(stage.id)!);

  const requestClose = () => {
    if (formState.isDirty) {
      setDiscardDialogOpen(true);
      return;
    }
    onClose();
  };
  const addStage = () => {
    if (!selectedStageId || selectedIds.has(selectedStageId)) return;
    append({ stageId: selectedStageId });
    setSelectedStageId("");
  };
  const submit = (values: FormValues) => {
    const groupCode = values.groupCode.trim().toUpperCase();
    onSubmit({
      ...(groupCode ? { groupCode } : {}),
      groupName: values.groupName,
      description: values.description || null,
      items: values.items.map((item, orderIndex) => ({ ...item, orderIndex })),
    });
  };

  return (
    <>
      <Modal
        open={!discardDialogOpen}
        size="xl"
        title={mode === "create" ? "Tạo nhóm công đoạn" : "Chỉnh sửa nhóm công đoạn"}
        closeLabel="Đóng biểu mẫu nhóm công đoạn"
        onClose={requestClose}
        footer={
          <>
            <Button variant="outline" onClick={requestClose}>
              Hủy
            </Button>
            <Button form="stage-group-form" type="submit" loading={isSubmitting}>
              {mode === "create" ? "Tạo Nhóm Công Đoạn" : "Lưu nhóm công đoạn"}
            </Button>
          </>
        }
      >
        <form
          id="stage-group-form"
          className="space-y-5"
          onSubmit={handleSubmit(submit)}
          noValidate
        >
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
            items={fields.map((field) => ({ fieldId: field.id, stageId: field.stageId }))}
            stagesById={stagesById}
            availableStages={availableStages}
            selectedStageId={selectedStageId}
            error={formState.errors.items?.root?.message ?? formState.errors.items?.message}
            onSelectedStageChange={setSelectedStageId}
            onAdd={addStage}
            onMove={move}
            onChange={(index, stageId) => update(index, { stageId })}
            onRemove={remove}
          />
        </form>
      </Modal>
      <ConfirmDialog
        open={discardDialogOpen}
        title="Hủy các thay đổi?"
        description="Các thông tin nhóm công đoạn chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onClose={() => setDiscardDialogOpen(false)}
        onConfirm={onClose}
      />
    </>
  );
}
