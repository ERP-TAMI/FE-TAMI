import { useState } from "react";
import axios from "axios";
import { Alert, Button, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { useMaterialGroup, useMaterialGroups } from "../../material-groups/hooks/useMaterialGroups";
import { MaterialForm } from "../components/MaterialForm";
import { MaterialTable } from "../components/MaterialTable";
import { useCreateMaterial, useMaterials, useUpdateMaterial } from "../hooks/useMaterials";
import type { Material, MaterialInput } from "../types/material.types";

function message(error: unknown): string {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : "Unable to save material. Check the Backend API and try again.";
}
export default function MaterialListPage() {
  const [editing, setEditing] = useState<Material | "create" | undefined>();
  const [toast, setToast] = useState("");
  const list = useMaterials();
  const activeGroups = useMaterialGroups("active");
  const currentGroup = useMaterialGroup(
    editing && editing !== "create" ? editing.materialGroupId : undefined,
  );
  const create = useCreateMaterial();
  const update = useUpdateMaterial();
  const saveError = create.error ?? update.error;
  const save = async (input: MaterialInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input);
      else if (editing) await update.mutateAsync({ id: editing.id, input });
      setToast(editing === "create" ? "Material created." : "Material updated.");
      setEditing(undefined);
    } catch {
      /* Form displays the server error. */
    }
  };
  return (
    <>
      <PageMeta title="Materials | TAMI ERP" description="Manage materials" />
      <section aria-labelledby="materials-title" className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
              Master data
            </p>
            <h1
              id="materials-title"
              className="text-title-md mt-2 font-semibold text-gray-900 dark:text-white"
            >
              Materials
            </h1>
            <p className="text-theme-sm mt-2 text-gray-500 dark:text-gray-400">
              Create and maintain material master data.
            </p>
          </div>
          <Button onClick={() => setEditing("create")}>Create material</Button>
        </div>
        {(list.isLoading || activeGroups.isLoading) && (
          <div
            aria-busy="true"
            aria-label="Loading materials"
            className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        )}
        {list.isError && (
          <Alert variant="error" title="Unable to load materials">
            {message(list.error)}{" "}
            <Button variant="ghost" size="sm" onClick={() => void list.refetch()}>
              Retry
            </Button>
          </Alert>
        )}
        {activeGroups.isError && (
          <Alert variant="error" title="Unable to load material groups">
            {message(activeGroups.error)}{" "}
            <Button variant="ghost" size="sm" onClick={() => void activeGroups.refetch()}>
              Retry
            </Button>
          </Alert>
        )}
        {list.data && <MaterialTable materials={list.data} onEdit={setEditing} />}
      </section>
      {editing && (
        <MaterialForm
          mode={editing === "create" ? "create" : "edit"}
          material={editing === "create" ? undefined : editing}
          activeGroups={activeGroups.data ?? []}
          historicalGroup={currentGroup.data}
          isSubmitting={create.isPending || update.isPending}
          serverError={saveError ? message(saveError) : undefined}
          onClose={() => setEditing(undefined)}
          onSubmit={(input) => void save(input)}
        />
      )}
      <Toast open={Boolean(toast)} message={toast} onClose={() => setToast("")} />
    </>
  );
}
