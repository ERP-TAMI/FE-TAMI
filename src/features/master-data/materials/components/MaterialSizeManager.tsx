import { useState } from "react";
import axios from "axios";
import { Alert, Button, Modal, Table, Toast } from "@/components/shared";
import {
  useCreateMaterialSize,
  useMaterialSizes,
  useUpdateMaterialSize,
  useUpdateMaterialSizeStatus,
} from "../hooks/useMaterialSizes";
import type { MaterialSize, MaterialSizeInput } from "../types/material-size.types";
import type { Material } from "../types/material.types";
import { MaterialSizeForm } from "./MaterialSizeForm";
import { MaterialSizeStatusConfirmDialog } from "./MaterialSizeStatusConfirmDialog";

function message(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) && typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : fallback;
}

export function MaterialSizeManager({
  material,
  onClose,
}: {
  material: Material;
  onClose: () => void;
}) {
  const list = useMaterialSizes(material.id);
  const create = useCreateMaterialSize(material.id);
  const update = useUpdateMaterialSize(material.id);
  const updateStatus = useUpdateMaterialSizeStatus(material.id);
  const [editing, setEditing] = useState<MaterialSize | "create">();
  const [statusSize, setStatusSize] = useState<MaterialSize>();
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState("");
  const saveError = create.error ?? update.error;

  const resetSaveState = () => {
    create.reset();
    update.reset();
  };
  const openCreateForm = () => {
    resetSaveState();
    setEditing("create");
  };
  const openEditForm = (size: MaterialSize) => {
    resetSaveState();
    setEditing(size);
  };

  const closeManager = () => {
    if (!isDirty || window.confirm("Discard unsaved size changes?")) onClose();
  };
  const closeForm = () => {
    resetSaveState();
    setEditing(undefined);
    setIsDirty(false);
  };
  const save = async (input: MaterialSizeInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input);
      else if (editing) await update.mutateAsync({ id: editing.id, input });
      setToast(editing === "create" ? "Size created." : "Size updated.");
      closeForm();
    } catch {
      /* The form displays the API error. */
    }
  };
  const confirmStatus = async () => {
    if (!statusSize) return;
    const status = statusSize.status === "active" ? "inactive" : "active";
    try {
      await updateStatus.mutateAsync({ id: statusSize.id, status });
      setToast(`Size ${status === "active" ? "activated" : "deactivated"}.`);
      setStatusSize(undefined);
    } catch (error) {
      setToast(message(error, "Unable to update size status."));
    }
  };

  return (
    <>
      <Modal
        open
        title={`Manage sizes — ${material.materialName}`}
        onClose={closeManager}
        footer={
          <Button variant="outline" onClick={closeManager}>
            Close
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              {material.materialCode} · Size-level cost and stock details
            </p>
            {!editing && <Button onClick={openCreateForm}>Add size</Button>}
          </div>
          {editing && (
            <MaterialSizeForm
              key={editing === "create" ? "create" : editing.id}
              mode={editing === "create" ? "create" : "edit"}
              size={editing === "create" ? undefined : editing}
              isSubmitting={create.isPending || update.isPending}
              serverError={
                saveError ? message(saveError, "Unable to save material size.") : undefined
              }
              onCancel={closeForm}
              onSubmit={(input) => void save(input)}
              onDirtyChange={setIsDirty}
            />
          )}
          {list.isError && (
            <Alert variant="error" title="Unable to load sizes">
              {message(list.error, "Cannot load material sizes.")}{" "}
              <Button variant="ghost" size="sm" onClick={() => void list.refetch()}>
                Retry
              </Button>
            </Alert>
          )}
          {list.isLoading ? (
            <div aria-busy="true" aria-label="Loading material sizes" className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : (
            <Table
              rows={list.data ?? []}
              getRowKey={(size) => size.id}
              emptyMessage="No sizes have been created."
              columns={[
                { key: "size", header: "Size", render: (size) => size.sizeCode },
                { key: "barcode", header: "Barcode", render: (size) => size.barcode ?? "—" },
                { key: "cost", header: "Unit cost", render: (size) => size.unitCost },
                { key: "stock", header: "Stock", render: (size) => size.currentStock },
                {
                  key: "threshold",
                  header: "Low threshold",
                  render: (size) => size.lowStockThreshold,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (size) => (size.status === "active" ? "Active" : "Inactive"),
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (size) => (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditForm(size)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setStatusSize(size)}>
                        {size.status === "active" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      </Modal>
      {statusSize && (
        <MaterialSizeStatusConfirmDialog
          size={statusSize}
          isSubmitting={updateStatus.isPending}
          onClose={() => setStatusSize(undefined)}
          onConfirm={() => void confirmStatus()}
        />
      )}
      <Toast open={Boolean(toast)} message={toast} onClose={() => setToast("")} />
    </>
  );
}
