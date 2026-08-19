import { useDeferredValue, useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, Input, Select, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { useMaterialGroup, useMaterialGroups } from "../../material-groups/hooks/useMaterialGroups";
import { MaterialForm } from "../components/MaterialForm";
import { MaterialStatusConfirmDialog } from "../components/MaterialStatusConfirmDialog";
import { MaterialTable } from "../components/MaterialTable";
import { useActiveUnits } from "../hooks/useUnits";
import {
  useCreateMaterial,
  useMaterials,
  useUpdateMaterial,
  useUpdateMaterialStatus,
} from "../hooks/useMaterials";
import type {
  Material,
  MaterialInput,
  MaterialListFilters,
  MaterialStatus,
} from "../types/material.types";

function message(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : fallback;
}

export default function MaterialListPage() {
  const [editing, setEditing] = useState<Material | "create" | undefined>();
  const [statusDialog, setStatusDialog] = useState<Material>();
  const [search, setSearch] = useState("");
  const [materialGroupId, setMaterialGroupId] = useState<string>();
  const [status, setStatus] = useState<MaterialStatus | undefined>();
  const [toast, setToast] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const deferredSearch = useDeferredValue(search.trim());
  const filters: MaterialListFilters = {
    ...(deferredSearch ? { search: deferredSearch } : {}),
    ...(materialGroupId ? { materialGroupId } : {}),
    ...(status ? { status } : {}),
  };
  const list = useMaterials(filters);
  const activeGroups = useMaterialGroups("active");
  const currentGroup = useMaterialGroup(
    editing && editing !== "create" ? (editing.materialGroupId ?? undefined) : undefined,
  );
  const activeUnits = useActiveUnits();
  const create = useCreateMaterial();
  const update = useUpdateMaterial();
  const updateStatus = useUpdateMaterialStatus();
  const saveError = create.error ?? update.error;

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const closeForm = () => {
    setEditing(undefined);
    setIsDirty(false);
  };
  const save = async (input: MaterialInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input);
      else if (editing) await update.mutateAsync({ id: editing.id, input });
      setToast(editing === "create" ? "Material created." : "Material updated.");
      closeForm();
    } catch {
      /* The form renders the server error. */
    }
  };
  const confirmStatus = async () => {
    if (!statusDialog) return;
    const nextStatus: MaterialStatus = statusDialog.status === "active" ? "inactive" : "active";
    try {
      await updateStatus.mutateAsync({ id: statusDialog.id, status: nextStatus });
      setToast(`Material ${nextStatus === "active" ? "activated" : "deactivated"}.`);
      setStatusDialog(undefined);
    } catch (error) {
      setToast(message(error, "Unable to update material status."));
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
              Maintain material and accessory master data.
            </p>
          </div>
          <Button onClick={() => setEditing("create")}>Create material</Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            aria-label="Search materials"
            placeholder="Search code or name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            label="Material group"
            value={materialGroupId ?? ""}
            onChange={(event) => setMaterialGroupId(event.target.value || undefined)}
            options={[
              { label: "All material groups", value: "" },
              ...(activeGroups.data ?? []).map((group) => ({
                label: `${group.code} — ${group.name}`,
                value: group.id,
              })),
            ]}
          />
          <Select
            label="Status"
            value={status ?? ""}
            onChange={(event) =>
              setStatus((event.target.value || undefined) as MaterialStatus | undefined)
            }
            options={[
              { label: "All statuses", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </div>
        {list.isLoading && (
          <div aria-busy="true" aria-label="Loading materials" className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        )}
        {list.isError && (
          <Alert variant="error" title="Unable to load materials">
            {message(
              list.error,
              "Cannot reach the Backend API. Check that Erp-BE is running and the API URL is configured correctly.",
            )}{" "}
            <Button variant="ghost" size="sm" onClick={() => void list.refetch()}>
              Retry
            </Button>
          </Alert>
        )}
        {(activeGroups.isError || activeUnits.isError) && (
          <Alert variant="error" title="Unable to load form options">
            {message(
              activeGroups.error ?? activeUnits.error,
              "Cannot load active groups or units.",
            )}{" "}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void activeGroups.refetch();
                void activeUnits.refetch();
              }}
            >
              Retry
            </Button>
          </Alert>
        )}
        {list.data && (
          <MaterialTable materials={list.data} onEdit={setEditing} onStatus={setStatusDialog} />
        )}
      </section>
      {editing && (
        <MaterialForm
          mode={editing === "create" ? "create" : "edit"}
          material={editing === "create" ? undefined : editing}
          activeGroups={activeGroups.data ?? []}
          historicalGroup={currentGroup.data}
          activeUnits={activeUnits.data ?? []}
          isSubmitting={create.isPending || update.isPending}
          serverError={saveError ? message(saveError, "Unable to save material.") : undefined}
          onClose={closeForm}
          onSubmit={(input) => void save(input)}
          onDirtyChange={setIsDirty}
        />
      )}
      {statusDialog && (
        <MaterialStatusConfirmDialog
          material={statusDialog}
          isSubmitting={updateStatus.isPending}
          onClose={() => setStatusDialog(undefined)}
          onConfirm={() => void confirmStatus()}
        />
      )}
      <Toast open={Boolean(toast)} message={toast} onClose={() => setToast("")} />
    </>
  );
}
