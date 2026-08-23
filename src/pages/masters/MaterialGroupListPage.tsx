import { useEffect, useState } from "react";
import { Alert, Button, ConfirmDialog, PageHeader, Pagination, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { MaterialGroupForm } from "@/components/features/material-groups/MaterialGroupForm";
import { MaterialGroupTable } from "@/components/features/material-groups/MaterialGroupTable";
import { MaterialGroupToolbar } from "@/components/features/material-groups/MaterialGroupToolbar";
import {
  useCreateMaterialGroup,
  useDeleteMaterialGroup,
  useMaterialGroups,
  useUpdateMaterialGroup,
  useUpdateMaterialGroupStatus,
} from "@/hooks/useMaterialGroups";
import { useMaterialGroupListView } from "@/hooks/useMaterialGroupListView";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { PlusIcon } from "@/icons";
import type { MaterialGroup, MaterialGroupInput, MaterialGroupStatus } from "@/types/material-group";

type Dialog = { type: "delete"; materialGroup: MaterialGroup } | undefined;
const emptyMaterialGroups: MaterialGroup[] = [];

export default function MaterialGroupListPage() {
  const [editing, setEditing] = useState<MaterialGroup | "create" | undefined>();
  const [dialog, setDialog] = useState<Dialog>();
  const [isDirty, setIsDirty] = useState(false);
  const { toast, showToast, hideToast } = useToast();
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
      showToast(editing === "create" ? "Đã tạo nhóm vật tư." : "Đã cập nhật nhóm vật tư.");
      closeForm();
    } catch {
      // Error is displayed in the form using the existing TailAdmin Input error state.
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    try {
      await remove.mutateAsync(dialog.materialGroup.id);
      showToast("Đã xóa nhóm vật tư.");
      setDialog(undefined);
    } catch (error) {
      showToast(getApiError(error, "Không thể xóa nhóm vật tư.").message, "error");
    }
  };

  const toggleStatus = async (materialGroup: MaterialGroup) => {
    const nextStatus: MaterialGroupStatus =
      materialGroup.status === "active" ? "inactive" : "active";
    try {
      await updateStatus.mutateAsync({ id: materialGroup.id, status: nextStatus });
      showToast(nextStatus === "active" ? "Đã bật nhóm vật tư." : "Đã tắt nhóm vật tư.");
    } catch (error) {
      showToast(getApiError(error, "Không thể đổi trạng thái nhóm vật tư.").message, "error");
    }
  };

  return (
    <>
      <PageMeta title="Nhóm vật tư | TAMI ERP" description="Quản lý danh mục nhóm vật tư" />
      <section aria-labelledby="page-title" className="space-y-4">
        <PageHeader
          breadcrumb={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Dữ liệu chung" },
            { label: "Nhóm vật tư" },
          ]}
          title="Nhóm vật tư"
          action={{
            label: "Tạo nhóm vật tư mới",
            onClick: () => setEditing("create"),
            icon: <PlusIcon className="h-4 w-4" aria-hidden="true" />,
          }}
        />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <MaterialGroupToolbar
            search={listView.search}
            status={listView.status}
            onSearchChange={listView.setSearch}
            onStatusChange={listView.setStatus}
          />

          {list.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách nhóm vật tư">
              <MaterialGroupTable
                materialGroups={emptyMaterialGroups}
                loading
                onEdit={() => {}}
                onToggleStatus={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
          {list.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách nhóm vật tư">
                {
                  getApiError(
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
              <Pagination
                page={listView.page}
                pageSize={listView.pageSize}
                totalItems={listView.totalItems}
                totalPages={listView.totalPages}
                itemLabel="nhóm vật tư"
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
              ? getApiError(serverError, "Không thể lưu nhóm vật tư. Vui lòng thử lại.")
              : undefined
          }
          onClose={closeForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsDirty}
        />
      )}
      {dialog && (
        <ConfirmDialog
          open
          title="Xóa nhóm vật tư"
          description={
            <>
              Bạn có chắc muốn xóa "{dialog.materialGroup.name}"? Chỉ có thể xóa khi chưa có vật
              tư tham chiếu.
            </>
          }
          confirmLabel="Xóa"
          variant="danger"
          isSubmitting={mutation}
          onClose={() => setDialog(undefined)}
          onConfirm={() => void confirmDialog()}
        />
      )}
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        closeLabel="Đóng thông báo"
        onClose={hideToast}
      />
    </>
  );
}
