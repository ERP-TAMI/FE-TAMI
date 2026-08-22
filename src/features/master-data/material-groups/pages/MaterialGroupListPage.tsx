import { useEffect, useState } from "react";
import axios from "axios";
import { Alert, Button, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { MaterialGroupConfirmDialog } from "../components/MaterialGroupConfirmDialog";
import { MaterialGroupForm } from "../components/MaterialGroupForm";
import { MaterialGroupOverview } from "../components/MaterialGroupOverview";
import { MaterialGroupPagination } from "../components/MaterialGroupPagination";
import { MaterialGroupPageHeader } from "../components/MaterialGroupPageHeader";
import { MaterialGroupTable } from "../components/MaterialGroupTable";
import { MaterialGroupToolbar } from "../components/MaterialGroupToolbar";
import {
  useCreateMaterialGroup,
  useDeleteMaterialGroup,
  useMaterialGroups,
  useUpdateMaterialGroup,
  useUpdateMaterialGroupStatus,
} from "../hooks/useMaterialGroups";
import { useMaterialGroupListView } from "../hooks/useMaterialGroupListView";
import type {
  MaterialGroup,
  MaterialGroupInput,
  MaterialGroupStatus,
} from "../types/material-group.types";

type Dialog = { type: "status" | "delete"; materialGroup: MaterialGroup } | undefined;
const emptyMaterialGroups: MaterialGroup[] = [];

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message !== "string") return fallback;

    const translations: Record<string, string> = {
      "Material group name already exists": "Tên nhóm vật tư đã tồn tại.",
      "Material group code or name already exists": "Mã hoặc tên nhóm vật tư đã tồn tại.",
      "Material group not found": "Không tìm thấy nhóm vật tư.",
      "Material group cannot be deleted because materials reference it":
        "Không thể xóa nhóm vì đang được vật tư tham chiếu.",
      "Material group cannot be deleted because it is referenced by business data":
        "Không thể xóa nhóm vì đang được dữ liệu nghiệp vụ tham chiếu.",
    };
    return translations[message] ?? message;
  }
  return fallback;
}

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
  const mutation =
    create.isPending || update.isPending || updateStatus.isPending || remove.isPending;
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
      if (dialog.type === "delete") {
        await remove.mutateAsync(dialog.materialGroup.id);
        setToast("Đã xóa nhóm vật tư.");
      } else {
        const nextStatus: MaterialGroupStatus =
          dialog.materialGroup.status === "active" ? "inactive" : "active";
        await updateStatus.mutateAsync({ id: dialog.materialGroup.id, status: nextStatus });
        setToast(
          nextStatus === "active" ? "Đã kích hoạt nhóm vật tư." : "Đã ngừng hoạt động nhóm vật tư.",
        );
      }
      setDialog(undefined);
    } catch (error) {
      setToast(getErrorMessage(error, "Không thể cập nhật nhóm vật tư."));
    }
  };

  return (
    <>
      <PageMeta title="Nhóm vật tư | TAMI ERP" description="Quản lý danh mục nhóm vật tư" />
      <section aria-labelledby="page-title" className="space-y-6">
        <MaterialGroupPageHeader onCreate={() => setEditing("create")} />

        <MaterialGroupOverview {...listView.overview} />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <MaterialGroupToolbar
            search={listView.search}
            status={listView.status}
            onSearchChange={listView.setSearch}
            onStatusChange={listView.setStatus}
          />

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
                {getErrorMessage(
                  list.error,
                  "Không thể kết nối đến máy chủ. Vui lòng kiểm tra Backend và thử lại.",
                )}{" "}
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
                onEdit={setEditing}
                onStatus={(materialGroup) => setDialog({ type: "status", materialGroup })}
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
              ? getErrorMessage(
                  serverError,
                  "Không thể kết nối đến máy chủ. Vui lòng kiểm tra Backend và thử lại.",
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
      <Toast
        open={Boolean(toast)}
        message={toast}
        closeLabel="Đóng thông báo"
        onClose={() => setToast("")}
      />
    </>
  );
}
