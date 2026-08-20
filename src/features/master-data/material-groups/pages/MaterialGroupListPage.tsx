import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, Select, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { MaterialGroupConfirmDialog } from "../components/MaterialGroupConfirmDialog";
import { MaterialGroupForm } from "../components/MaterialGroupForm";
import { MaterialGroupTable } from "../components/MaterialGroupTable";
import {
  useCreateMaterialGroup,
  useDeleteMaterialGroup,
  useMaterialGroups,
  useUpdateMaterialGroup,
  useUpdateMaterialGroupStatus,
} from "../hooks/useMaterialGroups";
import type {
  MaterialGroup,
  MaterialGroupInput,
  MaterialGroupStatus,
} from "../types/material-group.types";

type Dialog = { type: "status" | "delete"; materialGroup: MaterialGroup } | undefined;

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return typeof message === "string" ? message : fallback;
  }
  return fallback;
}

export default function MaterialGroupListPage() {
  const [status, setStatus] = useState<MaterialGroupStatus | undefined>();
  const [editing, setEditing] = useState<MaterialGroup | "create" | undefined>();
  const [dialog, setDialog] = useState<Dialog>();
  const [toast, setToast] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const list = useMaterialGroups(status);
  const create = useCreateMaterialGroup();
  const update = useUpdateMaterialGroup();
  const updateStatus = useUpdateMaterialGroupStatus();
  const remove = useDeleteMaterialGroup();
  const mutation =
    create.isPending || update.isPending || updateStatus.isPending || remove.isPending;
  const serverError = create.error ?? update.error;

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

  const saveForm = async (input: MaterialGroupInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input);
      else if (editing) await update.mutateAsync({ id: editing.id, input });
      setToast(editing === "create" ? "Material group created." : "Material group updated.");
      closeForm();
    } catch {
      // Error is displayed in the form using the existing TailAdmin Input error state.
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    try {
      if (dialog.type === "delete") {
        await remove.mutateAsync(dialog.materialGroup.id);
        setToast("Material group deleted.");
      } else {
        const nextStatus: MaterialGroupStatus =
          dialog.materialGroup.status === "active" ? "inactive" : "active";
        await updateStatus.mutateAsync({ id: dialog.materialGroup.id, status: nextStatus });
        setToast(`Material group ${nextStatus === "active" ? "activated" : "deactivated"}.`);
      }
      setDialog(undefined);
    } catch (error) {
      setToast(getErrorMessage(error, "Unable to update material group."));
    }
  };

  return (
    <>
      <PageMeta title="Material groups | TAMI ERP" description="Manage material groups" />
      <section aria-labelledby="page-title" className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-theme-xs text-brand-500 font-medium tracking-wider uppercase">
              Master data
            </p>
            <h1
              id="page-title"
              className="text-title-md mt-2 font-semibold text-gray-900 dark:text-white"
            >
              Material groups
            </h1>
            <p className="text-theme-sm mt-2 text-gray-500 dark:text-gray-400">
              Maintain the groups used to organize materials.
            </p>
          </div>
          <Button onClick={() => setEditing("create")}>Create material group</Button>
        </div>

        <div className="max-w-xs">
          <Select
            label="Status filter"
            value={status ?? ""}
            onChange={(event) =>
              setStatus((event.target.value || undefined) as MaterialGroupStatus | undefined)
            }
            options={[
              { label: "All statuses", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </div>

        {list.isLoading && (
          <div aria-busy="true" aria-label="Loading material groups" className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        )}
        {list.isError && (
          <Alert variant="error" title="Unable to load material groups">
            {getErrorMessage(
              list.error,
              "Cannot reach the Backend API. Check that Erp-BE is running and the API URL is configured correctly.",
            )}{" "}
            <Button variant="ghost" size="sm" onClick={() => void list.refetch()}>
              Retry
            </Button>
          </Alert>
        )}
        {list.data && (
          <MaterialGroupTable
            materialGroups={list.data}
            onEdit={setEditing}
            onStatus={(materialGroup) => setDialog({ type: "status", materialGroup })}
            onDelete={(materialGroup) => setDialog({ type: "delete", materialGroup })}
          />
        )}
      </section>

      {editing && (
        <MaterialGroupForm
          mode={editing === "create" ? "create" : "edit"}
          materialGroup={editing === "create" ? undefined : editing}
          isSubmitting={create.isPending || update.isPending}
          serverError={
            serverError
              ? getErrorMessage(
                  serverError,
                  "Cannot reach the Backend API. Check that Erp-BE is running and the API URL is configured correctly.",
                )
              : undefined
          }
          onClose={closeForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsDirty}
        />
      )}
      {dialog && (
        <MaterialGroupConfirmDialog
          action={dialog.type}
          materialGroup={dialog.materialGroup}
          isSubmitting={mutation}
          onClose={() => setDialog(undefined)}
          onConfirm={() => void confirmDialog()}
        />
      )}
      <Toast open={Boolean(toast)} message={toast} onClose={() => setToast("")} />
    </>
  );
}
