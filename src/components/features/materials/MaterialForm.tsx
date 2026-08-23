import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, ConfirmDialog, Input, Modal, Select } from "@/components/shared";
import type { ApiError } from "@/lib/apiError";
import type { MaterialGroup } from "@/types/material-group";
import type { Material, MaterialInput, Unit } from "@/types/material";

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
  lastUnitCost: decimal(
    /^\d{1,16}(?:\.\d{1,2})?$/,
    "Đơn giá phải là số không âm, tối đa 2 chữ số thập phân",
  ),
  currentStock: decimal(
    /^\d{1,14}(?:\.\d{1,4})?$/,
    "Tồn kho phải là số không âm, tối đa 4 chữ số thập phân",
  ),
  lowStockThreshold: decimal(
    /^\d{1,14}(?:\.\d{1,4})?$/,
    "Ngưỡng tồn thấp phải là số không âm, tối đa 4 chữ số thập phân",
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
  onSubmit: (input: MaterialInput) => void;
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
  const currentGroupMissing =
    material?.materialGroupId &&
    !materialGroups.some((group) => group.id === material.materialGroupId);
  const currentUnitMissing =
    material?.defaultUnitId && !units.some((unit) => unit.id === material.defaultUnitId);
  const groupOptions = [
    { value: "", label: "Không thuộc nhóm" },
    ...materialGroups.map((group) => ({ value: group.id, label: group.name })),
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
    ...units.map((unit) => ({ value: unit.id, label: `${unit.code} — ${unit.name}` })),
    ...(currentUnitMissing
      ? [
          {
            value: material.defaultUnitId!,
            label: `${material.defaultUnitCode ?? "ĐVT"} — ${material.defaultUnitName ?? "Đơn vị hiện tại"} (đã tắt)`,
          },
        ]
      : []),
  ];
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: material
      ? {
          materialCode: material.materialCode,
          materialName: material.materialName,
          materialGroupId: material.materialGroupId ?? "",
          defaultUnitId: material.defaultUnitId ?? "",
          defaultYieldPct: material.defaultYieldPct,
          lastUnitCost: material.lastUnitCost,
          currentStock: material.currentStock,
          lowStockThreshold: material.lowStockThreshold,
        }
      : {
          materialCode: "",
          materialName: "",
          materialGroupId: "",
          defaultUnitId: units[0]?.id ?? "",
          defaultYieldPct: "0",
          lastUnitCost: "0",
          currentStock: "0",
          lowStockThreshold: "10",
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
  const submit = (values: FormValues) =>
    onSubmit({
      ...values,
      materialCode: values.materialCode.toUpperCase(),
      materialGroupId: values.materialGroupId || null,
    });

  return (
    <>
      <Modal
        open={!discardDialogOpen}
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
            <Select
              label="Đơn vị tính"
              options={unitOptions}
              error={formState.errors.defaultUnitId?.message}
              {...register("defaultUnitId")}
            />
            <Input
              label="Yield mặc định (%)"
              inputMode="decimal"
              error={formState.errors.defaultYieldPct?.message}
              {...register("defaultYieldPct")}
            />
            <Input
              label="Đơn giá gần nhất"
              inputMode="decimal"
              error={formState.errors.lastUnitCost?.message}
              {...register("lastUnitCost")}
            />
            <Input
              label="Tồn kho hiện tại"
              inputMode="decimal"
              error={formState.errors.currentStock?.message}
              {...register("currentStock")}
            />
            <Input
              label="Ngưỡng tồn thấp"
              inputMode="decimal"
              error={formState.errors.lowStockThreshold?.message}
              {...register("lowStockThreshold")}
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
        onConfirm={discardChanges}
      />
    </>
  );
}
