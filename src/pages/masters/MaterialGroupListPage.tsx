import { useEffect, useState } from "react";
import { Alert, Button, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { MaterialGroupConfirmDialog } from "@/components/features/material-groups/MaterialGroupConfirmDialog";
import { MaterialGroupForm } from "@/components/features/material-groups/MaterialGroupForm";
import { MaterialGroupPagination } from "@/components/features/material-groups/MaterialGroupPagination";
import { MaterialGroupPageHeader } from "@/components/features/material-groups/MaterialGroupPageHeader";
import { MaterialGroupTable } from "@/components/features/material-groups/MaterialGroupTable";
import { MaterialGroupToolbar } from "@/components/features/material-groups/MaterialGroupToolbar";
import {
  useCreateMaterialGroup,
  useDeleteMaterialGroup,
  useMaterialGroups,
  useUpdateMaterialGroup,
  useUpdateMaterialGroupStatus,
} from "@/features/material-groups/hooks/useMaterialGroups";
import { useMaterialGroupListView } from "@/features/material-groups/hooks/useMaterialGroupListView";
import type { MaterialGroup, MaterialGroupInput, MaterialGroupStatus } from "@/types/material-group";
import { getMaterialGroupError } from "./utils/material-group-error";

type Dialog = { type: "delete"; materialGroup: MaterialGroup } | undefined;
const emptyMaterialGroups: MaterialGroup[] = [];

export default function MaterialGroupListPage() {
  const [editing, setEditing] = useState<MaterialGroup | "create" | undefined>();
  const [dialog, setDialog] = useState<Dialog>();
  const [toast, setToast] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const list = useMaterialGroups();
  const create = useCreateMaterialGroup();
  const update = useUpdateMaterialGroup();
  const updateStatus = useUpdateMaterialGroupStatus();
  const remove = useDeleteMaterialGroup();
  const mutation = create.isPending || update.isPending || remove.isPending;
  const serverError = create.error ?? update.error;
  const materialGroups = list.data ?? emptyMaterialGroups;
  const listView = useMaterialGroupListView(materialGroups);

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
      setToast(editing === "create" ? "Đã tạo nhóm vật tư." : "Đã cập nhật nhóm vật tư.");
      closeForm();
    } catch {
      // Error is displayed in the form using the existing TailAdmin Input error state.
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    try {
      await remove.mutateAsync(dialog.materialGroup.id);
      setToast("Đã xóa nhóm vật tư.");
      setDialog(undefined);
    } catch (error) {
      setToast(getMaterialGroupError(error, "Không thể xóa nhóm vật tư.").message);
    }
  };

  const toggleStatus = async (materialGroup: MaterialGroup) => {
    const nextStatus: MaterialGroupStatus =
      materialGroup.status === "active" ? "inactive" : "active";
    try {
      await updateStatus.mutateAsync({ id: materialGroup.id, status: nextStatus });
      setToast(
        nextStatus === "active" ? "Đã kích hoạt nhóm vật tư." : "Đã ngừng hoạt động nhóm vật tư.",
      );
    } catch (error) {
      setToast(getMaterialGroupError(error, "Không thể đổi trạng thái nhóm vật tư.").message);
    }
  };

  return (
    <>
      <PageMeta title="Nhóm vật tư | TAMI ERP" description="Quản lý danh mục nhóm vật tư" />
      <section aria-labelledby="page-title" className="space-y-4">
        <MaterialGroupPageHeader onCreate={() => setEditing("create")} />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <MaterialGroupToolbar search={listView.search} onSearchChange={listView.setSearch} />

          {list.isLoading && (
            <div
              aria-busy="true"
              aria-label="Đang tải danh sách nhóm vật tư"
              className="space-y-3 p-6"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-14 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </div>
          )}
          {list.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách nhóm vật tư">
                {
                  getMaterialGroupError(
                    list.error,
                    "Không thể kết nối đến máy chủ. Vui lòng kiểm tra Backend và thử lại.",
                  ).message
                }{" "}
                <Button variant="ghost" size="sm" onClick={() => void list.refetch()}>
                  Thử lại
                </Button>
              </Alert>
            </div>
          )}
          {list.data && (
            <>
              <MaterialGroupTable
                materialGroups={listView.paginatedMaterialGroups}
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                onEdit={setEditing}
                onToggleStatus={(materialGroup) => void toggleStatus(materialGroup)}
                onDelete={(materialGroup) => setDialog({ type: "delete", materialGroup })}
              />
              <MaterialGroupPagination
                page={listView.page}
                pageSize={listView.pageSize}
                totalItems={listView.totalItems}
                totalPages={listView.totalPages}
                onPageChange={listView.setPage}
              />
            </>
          )}
        </div>
      </section>

      {editing && (
        <MaterialGroupForm
          mode={editing === "create" ? "create" : "edit"}
          materialGroup={editing === "create" ? undefined : editing}
          isSubmitting={create.isPending || update.isPending}
          serverError={
            serverError
              ? getMaterialGroupError(serverError, "Không thể lưu nhóm vật tư. Vui lòng thử lại.")
              : undefined
          }
          onClose={closeForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsDirty}
        />
      )}
      {dialog && (
        <MaterialGroupConfirmDialog
          materialGroup={dialog.materialGroup}
          isSubmitting={mutation}
          onClose={() => setDialog(undefined)}
          onConfirm={() => void confirmDialog()}
        />
      )}
      <Toast
        open={Boolean(toast)}
        message={toast}
        closeLabel="Đóng thông báo"
        onClose={() => setToast("")}
      />
    </>
  );
}
