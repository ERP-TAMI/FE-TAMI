import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, ConfirmDialog, Input, Modal, Select } from "@/components/shared";
import { useCreateUnit } from "@/hooks/useMaterials";
import { getApiError } from "@/lib/apiError";
import type { ApiError } from "@/lib/apiError";
import type { MaterialGroup } from "@/types/material-group";
import type { Material, MaterialInput, MaterialUpdateInput, Unit } from "@/types/material";

const decimal = (pattern: RegExp, message: string) => z.string().trim().regex(pattern, message);

const schema = z.object({
  materialCode: z
    .string()
    .trim()
    .min(1, "Mã vật tư là bắt buộc")
    .max(50, "Mã vật tư không được vượt quá 50 ký tự"),
  materialName: z
    .string()
    .trim()
    .min(1, "Tên vật tư là bắt buộc")
    .max(255, "Tên vật tư không được vượt quá 255 ký tự"),
  materialGroupId: z.string(),
  defaultUnitId: z.string().uuid("Đơn vị tính là bắt buộc"),
  defaultYieldPct: decimal(
    /^\d{1,4}(?:\.\d{1,4})?$/,
    "Yield phải là số không âm, tối đa 4 chữ số thập phân",
  ),
});

type FormValues = z.infer<typeof schema>;
type MaterialFormProps = {
  mode: "create" | "edit";
  material?: Material;
  materialGroups: MaterialGroup[];
  units: Unit[];
  isSubmitting: boolean;
  serverError?: ApiError;
  onClose: () => void;
  onSubmit: (input: MaterialInput | MaterialUpdateInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function MaterialForm({
  mode,
  material,
  materialGroups,
  units,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: MaterialFormProps) {
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [newUnitDraft, setNewUnitDraft] = useState<{ name: string } | null>(null);
  const [newUnitError, setNewUnitError] = useState<string>();
  const createUnit = useCreateUnit();

  const currentGroupMissing =
    material?.materialGroupId &&
    !materialGroups.some((group) => group.id === material.materialGroupId);
  const currentUnitMissing =
    material?.defaultUnitId && !units.some((unit) => unit.id === material.defaultUnitId);
  const groupOptions = [
    { value: "", label: "Không thuộc nhóm" },
    ...[...materialGroups]
      .sort((a, b) => a.name.localeCompare(b.name, "vi"))
      .map((group) => ({ value: group.id, label: group.name })),
    ...(currentGroupMissing
      ? [
          {
            value: material.materialGroupId!,
            label: `${material.materialGroupName ?? "Nhóm hiện tại"} (đã tắt)`,
          },
        ]
      : []),
  ];
  const unitOptions = [
    { value: "", label: "Chọn đơn vị tính" },
    ...[...units]
      .sort((a, b) => a.name.localeCompare(b.name, "vi"))
      .map((unit) => ({ value: unit.id, label: unit.name })),
    ...(currentUnitMissing
      ? [
          {
            value: material.defaultUnitId!,
            label: `${material.defaultUnitName ?? "Đơn vị hiện tại"} (đã tắt)`,
          },
        ]
      : []),
  ];
  const { register, handleSubmit, formState, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: material
      ? {
          materialCode: material.materialCode,
          materialName: material.materialName,
          materialGroupId: material.materialGroupId ?? "",
          defaultUnitId: material.defaultUnitId ?? "",
          defaultYieldPct: material.defaultYieldPct,
        }
      : {
          materialCode: "",
          materialName: "",
          materialGroupId: "",
          defaultUnitId: "",
          defaultYieldPct: "0",
        },
  });

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);
  const requestClose = () => {
    if (formState.isDirty) {
      setDiscardDialogOpen(true);
      return;
    }

    onClose();
  };
  const discardChanges = () => {
    setDiscardDialogOpen(false);
    onClose();
  };

  const submit = (values: FormValues) => {
    if (mode === "create") {
      onSubmit({
        materialCode: values.materialCode.toUpperCase(),
        materialName: values.materialName,
        materialGroupId: values.materialGroupId || null,
        defaultUnitId: values.defaultUnitId,
        defaultYieldPct: values.defaultYieldPct,
      });
      return;
    }

    const dirty = formState.dirtyFields;
    const patch: MaterialUpdateInput = {};
    if (dirty.materialName) patch.materialName = values.materialName;
    if (dirty.materialGroupId) patch.materialGroupId = values.materialGroupId || null;
    if (dirty.defaultUnitId) patch.defaultUnitId = values.defaultUnitId;
    if (dirty.defaultYieldPct) patch.defaultYieldPct = values.defaultYieldPct;
    onSubmit(patch);
  };

  const confirmCreateUnit = async () => {
    if (!newUnitDraft) return;
    setNewUnitError(undefined);
    try {
      const unit = await createUnit.mutateAsync(newUnitDraft);
      setValue("defaultUnitId", unit.id, { shouldDirty: true, shouldValidate: true });
      setNewUnitDraft(null);
    } catch (error) {
      setNewUnitError(getApiError(error, "Không thể tạo đơn vị tính. Vui lòng thử lại.").message);
    }
  };

  return (
    <>
      <Modal
        open={!discardDialogOpen && !newUnitDraft}
        title={mode === "create" ? "Tạo vật tư" : "Chỉnh sửa vật tư"}
        closeLabel="Đóng biểu mẫu"
        onClose={requestClose}
        footer={
          <>
            <Button variant="outline" onClick={requestClose}>
              Hủy
            </Button>
            <Button form="material-form" type="submit" loading={isSubmitting}>
              Lưu vật tư
            </Button>
          </>
        }
      >
        <form id="material-form" className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
          {serverError && (
            <Alert variant="error" title="Không thể lưu vật tư">
              {serverError.message}
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Mã vật tư"
              placeholder="Ví dụ: FAB-001"
              disabled={mode === "edit"}
              error={formState.errors.materialCode?.message}
              {...register("materialCode")}
            />
            <Input
              label="Tên vật tư"
              placeholder="Ví dụ: Vải cotton"
              error={formState.errors.materialName?.message}
              {...register("materialName")}
            />
            <Select
              label="Nhóm vật tư"
              options={groupOptions}
              error={formState.errors.materialGroupId?.message}
              {...register("materialGroupId")}
            />
            <div className="space-y-2">
              <Select
                label="Đơn vị tính"
                options={unitOptions}
                error={formState.errors.defaultUnitId?.message}
                {...register("defaultUnitId")}
              />
              <button
                type="button"
                onClick={() => setNewUnitDraft({ name: "" })}
                className="text-brand-600 dark:text-brand-400 text-theme-xs font-medium hover:underline"
              >
                + Thêm đơn vị tính mới
              </button>
            </div>
            <Input
              label="Yield (%)"
              inputMode="decimal"
              error={formState.errors.defaultYieldPct?.message}
              {...register("defaultYieldPct")}
            />
          </div>
        </form>
      </Modal>
      <Modal
        open={Boolean(newUnitDraft)}
        title="Thêm đơn vị tính mới"
        closeLabel="Đóng"
        onClose={() => setNewUnitDraft(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setNewUnitDraft(null)}>
              Hủy
            </Button>
            <Button onClick={confirmCreateUnit} loading={createUnit.isPending}>
              Tạo đơn vị
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {newUnitError && (
            <Alert variant="error" title="Không thể tạo đơn vị tính">
              {newUnitError}
            </Alert>
          )}
          <Input
            label="Tên đơn vị"
            placeholder="Ví dụ: Cuộn"
            value={newUnitDraft?.name ?? ""}
            onChange={(event) =>
              setNewUnitDraft((draft) => (draft ? { ...draft, name: event.target.value } : draft))
            }
          />
        </div>
      </Modal>
      <ConfirmDialog
        open={discardDialogOpen}
        title="Hủy các thay đổi?"
        description="Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onClose={() => setDiscardDialogOpen(false)}
        onConfirm={discardChanges}
      />
    </>
  );
}
