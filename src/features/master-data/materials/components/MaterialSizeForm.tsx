import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, Button, Input } from "@/components/shared";
import {
  materialSizeFormSchema,
  type MaterialSizeFormValues,
} from "../schemas/material-size.schema";
import type { MaterialSize, MaterialSizeInput } from "../types/material-size.types";

type Props = {
  mode: "create" | "edit";
  size?: MaterialSize;
  isSubmitting: boolean;
  serverError?: string;
  onCancel: () => void;
  onSubmit: (input: MaterialSizeInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function MaterialSizeForm({
  mode,
  size,
  isSubmitting,
  serverError,
  onCancel,
  onSubmit,
  onDirtyChange,
}: Props) {
  const { register, handleSubmit, setError, setValue, formState } = useForm<MaterialSizeFormValues>(
    {
      defaultValues: size
        ? {
            sizeCode: size.sizeCode,
            barcode: size.barcode ?? "",
            unitCost: size.unitCost,
            currentStock: size.currentStock,
            lowStockThreshold: size.lowStockThreshold,
          }
        : {
            sizeCode: "",
            barcode: "",
            unitCost: 0,
            currentStock: 0,
            lowStockThreshold: 10,
          },
    },
  );
  const duplicateError = /already exists|duplicate/i.test(serverError ?? "");

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);
  useEffect(() => {
    if (duplicateError && serverError) {
      setError("sizeCode", { message: serverError });
    }
  }, [duplicateError, serverError, setError]);

  const cancel = () => {
    if (!formState.isDirty || window.confirm("Discard unsaved size changes?")) onCancel();
  };
  const submit = (values: MaterialSizeFormValues) => {
    const result = materialSizeFormSchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) =>
        setError(issue.path[0] as keyof MaterialSizeFormValues, { message: issue.message }),
      );
      return;
    }
    onSubmit({
      ...result.data,
      sizeCode: result.data.sizeCode.toUpperCase(),
      barcode: result.data.barcode || null,
    });
  };

  return (
    <form
      aria-label={mode === "create" ? "Create material size" : "Edit material size"}
      className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
      onSubmit={handleSubmit(submit)}
      noValidate
    >
      <div>
        <h3 className="text-theme-sm font-semibold text-gray-900 dark:text-white">
          {mode === "create" ? "Add size" : `Edit size ${size?.sizeCode ?? ""}`}
        </h3>
        <p className="text-theme-xs mt-1 text-gray-500 dark:text-gray-400">
          Material stock remains independent from size stock.
        </p>
      </div>
      {serverError && !duplicateError && (
        <Alert variant="error" title="Unable to save size">
          {serverError}
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Size"
          maxLength={20}
          error={formState.errors.sizeCode?.message}
          {...register("sizeCode", {
            onChange: (event) => {
              const code = event.target.value.toUpperCase();
              event.target.value = code;
              setValue("sizeCode", code, { shouldDirty: true });
            },
          })}
        />
        <Input
          label="Barcode"
          maxLength={50}
          error={formState.errors.barcode?.message}
          {...register("barcode")}
        />
        <Input
          label="Unit cost"
          type="number"
          min="0"
          step="0.01"
          error={formState.errors.unitCost?.message}
          {...register("unitCost", { valueAsNumber: true })}
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
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={cancel}>
          Cancel size form
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save size
        </Button>
      </div>
    </form>
  );
}
