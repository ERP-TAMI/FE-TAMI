import { useEffect, useState } from "react";
import { Alert, Button, ConfirmDialog, PageHeader, Pagination, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { UnitForm } from "@/components/features/units/UnitForm";
import { UnitTable } from "@/components/features/units/UnitTable";
import { UnitToolbar } from "@/components/features/units/UnitToolbar";
import {
  useCreateUnit,
  useDeleteUnit,
  useUnits,
  useUpdateUnit,
  useUpdateUnitStatus,
} from "@/hooks/useMaterials";
import { useUnitListView } from "@/hooks/useUnitListView";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { PlusIcon } from "@/icons";
import type { UnitInput } from "@/api/unit.api";
import type { MaterialStatus, Unit } from "@/types/material";

type Dialog = { type: "delete"; unit: Unit } | undefined;
const emptyUnits: Unit[] = [];

export default function UnitListPage() {
  const [editing, setEditing] = useState<Unit | "create" | undefined>();
  const [dialog, setDialog] = useState<Dialog>();
  const [isDirty, setIsDirty] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const list = useUnits();
  const create = useCreateUnit();
  const update = useUpdateUnit();
  const updateStatus = useUpdateUnitStatus();
  const remove = useDeleteUnit();
  const mutation = create.isPending || update.isPending || remove.isPending;
  const serverError = create.error ?? update.error;
  const units = list.data ?? emptyUnits;
  const listView = useUnitListView(units);

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
    create.reset();
    update.reset();
  };

  const saveForm = async (input: UnitInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input);
      else if (editing) await update.mutateAsync({ id: editing.id, input });
      showToast(editing === "create" ? "Đã tạo đơn vị tính." : "Đã cập nhật đơn vị tính.");
      closeForm();
    } catch {
      // Error is displayed in the form using the existing TailAdmin Input error state.
    }
  };

  const toggleStatus = async (unit: Unit) => {
    const nextStatus: MaterialStatus = unit.status === "active" ? "inactive" : "active";
    try {
      await updateStatus.mutateAsync({ id: unit.id, status: nextStatus });
      showToast(nextStatus === "active" ? "Đã kích hoạt đơn vị tính." : "Đã vô hiệu hóa đơn vị tính.");
    } catch (error) {
      showToast(getApiError(error, "Không thể đổi trạng thái đơn vị tính.").message, "error");
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    try {
      await remove.mutateAsync(dialog.unit.id);
      showToast("Đã xóa đơn vị tính.");
      setDialog(undefined);
    } catch (error) {
      showToast(getApiError(error, "Không thể xóa đơn vị tính.").message, "error");
    }
  };

  return (
    <>
      <PageMeta title="Đơn vị tính | TAMI ERP" description="Quản lý danh mục đơn vị tính" />
      <section aria-labelledby="page-title" className="space-y-4">
        <PageHeader
          breadcrumb={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Dữ liệu chung" },
            { label: "Đơn vị tính" },
          ]}
          title="Đơn vị tính"
          action={{
            label: "Tạo đơn vị tính mới",
            onClick: () => setEditing("create"),
            icon: <PlusIcon className="h-4 w-4" aria-hidden="true" />,
          }}
        />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <UnitToolbar
            search={listView.search}
            status={listView.status}
            onSearchChange={listView.setSearch}
            onStatusChange={listView.setStatus}
          />

          {list.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách đơn vị tính">
              <UnitTable
                units={emptyUnits}
                loading
                onEdit={() => {}}
                onToggleStatus={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
          {list.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách đơn vị tính">
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
              <UnitTable
                units={listView.paginatedUnits}
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                onEdit={setEditing}
                onToggleStatus={(unit) => void toggleStatus(unit)}
                onDelete={(unit) => setDialog({ type: "delete", unit })}
              />
              <Pagination
                page={listView.page}
                pageSize={listView.pageSize}
                totalItems={listView.totalItems}
                totalPages={listView.totalPages}
                itemLabel="đơn vị tính"
                onPageChange={listView.setPage}
              />
            </>
          )}
        </div>
      </section>

      {editing && (
        <UnitForm
          mode={editing === "create" ? "create" : "edit"}
          unit={editing === "create" ? undefined : editing}
          isSubmitting={create.isPending || update.isPending}
          serverError={
            serverError
              ? getApiError(serverError, "Không thể lưu đơn vị tính. Vui lòng thử lại.")
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
          title="Xóa đơn vị tính"
          description={
            <>
              Bạn có chắc muốn xóa "{dialog.unit.name}"? Chỉ có thể xóa khi chưa có vật tư nào
              tham chiếu.
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
