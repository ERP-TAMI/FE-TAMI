import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal, Select } from "@/components/shared";
import type { MaterialGroup } from "../../material-groups/types/material-group.types";
import type { Material, MaterialInput, MaterialLookup } from "../types/material.types";

const numericField = z
  .number({ invalid_type_error: "Enter a number" })
  .finite()
  .min(0, "Value cannot be negative");
const schema = z.object({
  materialCode: z
    .string()
    .trim()
    .min(1, "Material code is required")
    .max(50, "Code must be 50 characters or fewer"),
  materialName: z
    .string()
    .trim()
    .min(1, "Material name is required")
    .max(255, "Name must be 255 characters or fewer"),
  materialGroupId: z.string().uuid().or(z.literal("")),
  defaultUnitId: z.string().uuid("Select a unit"),
  defaultYieldPct: numericField,
  lastUnitCost: numericField,
  currentStock: numericField,
  lowStockThreshold: numericField,
});
type FormValues = z.infer<typeof schema>;
type Props = {
  mode: "create" | "edit";
  material?: Material;
  activeGroups: MaterialGroup[];
  historicalGroup?: MaterialGroup;
  activeUnits: MaterialLookup[];
  isSubmitting: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: MaterialInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

function withHistoricalOption<T extends MaterialLookup>(active: T[], historical?: T | null): T[] {
  return historical && !active.some((item) => item.id === historical.id)
    ? [historical, ...active]
    : active;
}

export function MaterialForm({
  mode,
  material,
  activeGroups,
  historicalGroup,
  activeUnits,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: Props) {
  const { register, handleSubmit, setError, setValue, formState } = useForm<FormValues>({
    defaultValues: material
      ? {
          materialCode: material.materialCode,
          materialName: material.materialName,
          materialGroupId: material.materialGroupId ?? "",
          defaultUnitId: material.defaultUnitId,
          defaultYieldPct: material.defaultYieldPct,
          lastUnitCost: material.lastUnitCost,
          currentStock: material.currentStock,
          lowStockThreshold: material.lowStockThreshold,
        }
      : {
          materialCode: "",
          materialName: "",
          materialGroupId: "",
          defaultUnitId: "",
          defaultYieldPct: 0,
          lastUnitCost: 0,
          currentStock: 0,
          lowStockThreshold: 10,
        },
  });
  const groups =
    historicalGroup &&
    historicalGroup.status === "inactive" &&
    !activeGroups.some((group) => group.id === historicalGroup.id)
      ? [historicalGroup, ...activeGroups]
      : activeGroups;
  const units = withHistoricalOption(activeUnits, material?.defaultUnit ?? undefined);
  const fieldForError = /unit/i.test(serverError ?? "")
    ? "defaultUnitId"
    : /group/i.test(serverError ?? "")
      ? "materialGroupId"
      : /code/i.test(serverError ?? "")
        ? "materialCode"
        : undefined;

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);
  useEffect(() => {
    if (serverError && fieldForError) setError(fieldForError, { message: serverError });
  }, [fieldForError, serverError, setError]);

  const closeWithWarning = () => {
    if (!formState.isDirty || window.confirm("Discard unsaved material changes?")) onClose();
  };
  const submit = (values: FormValues) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) =>
        setError(issue.path[0] as keyof FormValues, { message: issue.message }),
      );
      return;
    }
    const { materialGroupId, ...input } = result.data;
    onSubmit({
      ...input,
      materialCode: input.materialCode.toUpperCase(),
      ...(materialGroupId ? { materialGroupId } : {}),
    });
  };
  return (
    <Modal
      open
      title={mode === "create" ? "Create material" : "Edit material"}
      onClose={closeWithWarning}
      footer={
        <>
          <Button variant="outline" onClick={closeWithWarning}>
            Cancel
          </Button>
          <Button form="material-form" type="submit" loading={isSubmitting}>
            Save material
          </Button>
        </>
      }
    >
      <form id="material-form" className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        {serverError && !fieldForError && (
          <Alert variant="error" title="Unable to save material">
            {serverError}
          </Alert>
        )}
        <Input
          label="Material code"
          error={formState.errors.materialCode?.message}
          {...register("materialCode", {
            onChange: (event) => {
              const code = event.target.value.toUpperCase();
              event.target.value = code;
              setValue("materialCode", code, { shouldDirty: true });
            },
          })}
        />
        <Input
          label="Material name"
          error={formState.errors.materialName?.message}
          {...register("materialName")}
        />
        <Select
          label="Material group"
          options={[
            { label: "No material group", value: "" },
            ...groups.map((group) => ({
              value: group.id,
              label: `${group.code} — ${group.name}${"status" in group && group.status === "inactive" ? " (Inactive)" : ""}`,
            })),
          ]}
          error={formState.errors.materialGroupId?.message}
          {...register("materialGroupId")}
        />
        <Select
          label="Unit"
          options={[
            { label: "Select unit", value: "" },
            ...units.map((unit) => ({ value: unit.id, label: `${unit.code} — ${unit.name}` })),
          ]}
          error={formState.errors.defaultUnitId?.message}
          {...register("defaultUnitId")}
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Default yield (%)"
            type="number"
            min="0"
            step="0.0001"
            error={formState.errors.defaultYieldPct?.message}
            {...register("defaultYieldPct", { valueAsNumber: true })}
          />
          <Input
            label="Last unit cost"
            type="number"
            min="0"
            step="0.01"
            error={formState.errors.lastUnitCost?.message}
            {...register("lastUnitCost", { valueAsNumber: true })}
          />
          <Input
            label="Current stock"
            type="number"
            min="0"
            step="0.0001"
            error={formState.errors.currentStock?.message}
            {...register("currentStock", { valueAsNumber: true })}
          />
          <Input
            label="Low-stock threshold"
            type="number"
            min="0"
            step="0.0001"
            error={formState.errors.lowStockThreshold?.message}
            {...register("lowStockThreshold", { valueAsNumber: true })}
          />
        </div>
      </form>
    </Modal>
  );
}
