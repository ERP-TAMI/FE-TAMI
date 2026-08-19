import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Input, Modal, Select } from "@/components/shared";
import type { MaterialGroup } from "../../material-groups/types/material-group.types";
import type { Material, MaterialInput } from "../types/material.types";

const schema = z.object({
  materialCode: z.string().trim().min(1, "Material code is required").max(100),
  materialName: z.string().trim().min(1, "Material name is required").max(255),
  materialGroupId: z.string().uuid("Select a material group"),
});
type FormValues = z.infer<typeof schema>;
type Props = {
  mode: "create" | "edit";
  material?: Material;
  activeGroups: MaterialGroup[];
  historicalGroup?: MaterialGroup;
  isSubmitting: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: MaterialInput) => void;
};

export function MaterialForm({
  mode,
  material,
  activeGroups,
  historicalGroup,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}: Props) {
  const { register, handleSubmit, setError, formState } = useForm<FormValues>({
    defaultValues: material
      ? {
          materialCode: material.materialCode,
          materialName: material.materialName,
          materialGroupId: material.materialGroupId,
        }
      : { materialCode: "", materialName: "", materialGroupId: "" },
  });
  const groups =
    historicalGroup &&
    historicalGroup.status === "inactive" &&
    !activeGroups.some((group) => group.id === historicalGroup.id)
      ? [historicalGroup, ...activeGroups]
      : activeGroups;
  const options = [
    { label: "Select material group", value: "" },
    ...groups.map((group) => ({
      value: group.id,
      label: `${group.code} — ${group.name}${group.status === "inactive" ? " (Inactive)" : ""}`,
    })),
  ];
  useEffect(() => {
    if (serverError?.toLowerCase().includes("group"))
      setError("materialGroupId", { message: serverError });
  }, [serverError, setError]);
  const submit = (values: FormValues) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) =>
        setError(issue.path[0] as keyof FormValues, { message: issue.message }),
      );
      return;
    }
    onSubmit({ ...result.data, materialCode: result.data.materialCode.toUpperCase() });
  };
  return (
    <Modal
      open
      title={mode === "create" ? "Create material" : "Edit material"}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button form="material-form" type="submit" loading={isSubmitting}>
            Save material
          </Button>
        </>
      }
    >
      <form id="material-form" className="space-y-5" onSubmit={handleSubmit(submit)} noValidate>
        {serverError && !serverError.toLowerCase().includes("group") && (
          <Alert variant="error" title="Unable to save material">
            {serverError}
          </Alert>
        )}
        <Input
          label="Material code"
          error={formState.errors.materialCode?.message}
          {...register("materialCode")}
        />
        <Input
          label="Material name"
          error={formState.errors.materialName?.message}
          {...register("materialName")}
        />
        <Select
          label="Material group"
          options={options}
          error={formState.errors.materialGroupId?.message}
          {...register("materialGroupId")}
        />
      </form>
    </Modal>
  );
}
