import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal } from "@/components/shared";
import type { MaterialGroup, MaterialGroupInput } from "../types/material-group.types";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must be 150 characters or fewer"),
  displayOrder: z
    .number()
    .int("Display order must be an integer")
    .min(0, "Display order cannot be negative"),
});

type FormValues = z.infer<typeof schema>;

type MaterialGroupFormProps = {
  mode: "create" | "edit";
  materialGroup?: MaterialGroup;
  isSubmitting: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: MaterialGroupInput) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function MaterialGroupForm({
  mode,
  materialGroup,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
  onDirtyChange,
}: MaterialGroupFormProps) {
  const { register, handleSubmit, setError, formState } = useForm<FormValues>({
    defaultValues: materialGroup
      ? {
          name: materialGroup.name,
          displayOrder: materialGroup.displayOrder,
        }
      : { name: "", displayOrder: 0 },
  });

  useEffect(() => onDirtyChange?.(formState.isDirty), [formState.isDirty, onDirtyChange]);
  useEffect(() => {
    if (serverError?.toLowerCase().includes("name")) setError("name", { message: serverError });
  }, [serverError, setError]);
  const hasFieldError = Boolean(serverError && /name/i.test(serverError));

  const closeWithWarning = () => {
    if (!formState.isDirty || window.confirm("Discard unsaved material group changes?")) onClose();
  };

  const submit = (values: FormValues) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues)
        setError(issue.path[0] as keyof FormValues, { message: issue.message });
      return;
    }
    onSubmit(result.data);
  };

  return (
    <Modal
      open
      title={mode === "create" ? "Create material group" : "Edit material group"}
      onClose={closeWithWarning}
      footer={
        <>
          <Button variant="outline" onClick={closeWithWarning}>
            Cancel
          </Button>
          <Button form="material-group-form" type="submit" loading={isSubmitting}>
            Save material group
          </Button>
        </>
      }
    >
      <form
        id="material-group-form"
        className="space-y-5"
        onSubmit={handleSubmit(submit)}
        noValidate
      >
        {serverError && !hasFieldError && (
          <Alert variant="error" title="Unable to save material group">
            {serverError}
          </Alert>
        )}
        <Input label="Name" error={formState.errors.name?.message} {...register("name")} />
        <Input
          label="Display order"
          type="number"
          min="0"
          step="1"
          error={formState.errors.displayOrder?.message}
          {...register("displayOrder", { valueAsNumber: true })}
        />
      </form>
    </Modal>
  );
}
