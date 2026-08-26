import { useCallback, useEffect, useState } from "react";
import { useBlocker, type BlockerFunction } from "react-router-dom";
import { WorkshopForm } from "@/components/features/workshops/WorkshopForm";
import { WorkshopTable } from "@/components/features/workshops/WorkshopTable";
import { WorkshopToolbar } from "@/components/features/workshops/WorkshopToolbar";
import { Alert, Button, ConfirmDialog, PageHeader, Pagination, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import {
  useCreateWorkshop,
  useUpdateWorkshop,
  useUpdateWorkshopStatus,
  useWorkshops,
} from "@/hooks/useWorkshops";
import { useWorkshopListView } from "@/hooks/useWorkshopListView";
import { useToast } from "@/hooks/useToast";
import { PlusIcon } from "@/icons";
import { getApiError } from "@/lib/apiError";
import type {
  CreateWorkshopInput,
  UpdateWorkshopInput,
  Workshop,
  WorkshopStatus,
} from "@/types/workshop";

const emptyWorkshops: Workshop[] = [];

export default function WorkshopListPage() {
  const [editing, setEditing] = useState<Workshop | "create" | undefined>();
  const [deactivating, setDeactivating] = useState<Workshop>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const list = useWorkshops();
  const create = useCreateWorkshop();
  const update = useUpdateWorkshop();
  const updateStatus = useUpdateWorkshopStatus();
  const workshops = list.data ?? emptyWorkshops;
  const listView = useWorkshopListView(workshops);
  const shouldBlockNavigation = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      isFormDirty && currentLocation.pathname !== nextLocation.pathname,
    [isFormDirty],
  );
  const blocker = useBlocker(shouldBlockNavigation);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isFormDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isFormDirty]);

  const closeForm = () => {
    setEditing(undefined);
    setIsFormDirty(false);
    create.reset();
    update.reset();
  };

  const openForm = (next: Workshop | "create") => {
    create.reset();
    update.reset();
    setEditing(next);
  };

  const cancelNavigation = () => {
    if (blocker.state === "blocked") blocker.reset();
  };

  const discardAndNavigate = () => {
    setIsFormDirty(false);
    create.reset();
    update.reset();
    if (blocker.state === "blocked") blocker.proceed();
  };

  const saveForm = async (input: CreateWorkshopInput | UpdateWorkshopInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input as CreateWorkshopInput);
      else if (editing) {
        await update.mutateAsync({ id: editing.id, input: input as UpdateWorkshopInput });
      }
      showToast(editing === "create" ? "Đã tạo xưởng sản xuất." : "Đã cập nhật xưởng sản xuất.");
      closeForm();
    } catch {
      // The form keeps the entered data and displays the mutation error.
    }
  };

  const changeStatus = async (workshop: Workshop, status: WorkshopStatus) => {
    try {
      await updateStatus.mutateAsync({ id: workshop.id, status });
      showToast(status === "active" ? "Đã bật xưởng sản xuất." : "Đã tắt xưởng sản xuất.");
      setDeactivating(undefined);
    } catch (error) {
      showToast(getApiError(error, "Không thể đổi trạng thái xưởng sản xuất.").message, "error");
    }
  };

  const toggleStatus = (workshop: Workshop) => {
    if (workshop.status === "active") setDeactivating(workshop);
    else void changeStatus(workshop, "active");
  };

  const formError = editing === "create" ? create.error : editing ? update.error : null;

  return (
    <>
      <PageMeta title="Xưởng sản xuất | TAMI ERP" description="Quản lý danh mục xưởng sản xuất" />
      <section aria-labelledby="page-title" className="space-y-4">
        <PageHeader
          breadcrumb={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Dữ liệu chung" },
            { label: "Xưởng sản xuất" },
          ]}
          title="Xưởng sản xuất"
          stats={[
            { label: "xưởng", value: workshops.length },
            {
              label: "đang sử dụng",
              value: workshops.filter((workshop) => workshop.status === "active").length,
              tone: "success",
            },
          ]}
          action={{
            label: "Tạo xưởng sản xuất",
            onClick: () => openForm("create"),
            icon: <PlusIcon className="h-4 w-4" aria-hidden="true" />,
          }}
        />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <WorkshopToolbar
            search={listView.search}
            status={listView.status}
            onSearchChange={listView.setSearch}
            onStatusChange={listView.setStatus}
          />

          {list.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách xưởng sản xuất">
              <WorkshopTable
                workshops={emptyWorkshops}
                loading
                onEdit={() => {}}
                onToggleStatus={() => {}}
              />
            </div>
          )}
          {list.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách xưởng sản xuất">
                {
                  getApiError(list.error, "Không thể kết nối đến máy chủ. Vui lòng thử lại.")
                    .message
                }{" "}
                <Button variant="ghost" size="sm" onClick={() => void list.refetch()}>
                  Thử lại
                </Button>
              </Alert>
            </div>
          )}
          {list.data && (
            <>
              <WorkshopTable
                workshops={listView.paginatedWorkshops}
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                onEdit={openForm}
                onToggleStatus={toggleStatus}
              />
              <Pagination
                page={listView.page}
                pageSize={listView.pageSize}
                totalItems={listView.totalItems}
                totalPages={listView.totalPages}
                itemLabel="xưởng"
                onPageChange={listView.setPage}
              />
            </>
          )}
        </div>
      </section>

      {editing && (
        <WorkshopForm
          mode={editing === "create" ? "create" : "edit"}
          workshop={editing === "create" ? undefined : editing}
          isSubmitting={create.isPending || update.isPending}
          serverError={
            formError ? getApiError(formError, "Không thể lưu xưởng sản xuất.") : undefined
          }
          onClose={closeForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsFormDirty}
        />
      )}
      {deactivating && (
        <ConfirmDialog
          open
          title="Tắt xưởng sản xuất?"
          description={
            <>
              Xưởng "{deactivating.name}" sẽ không còn xuất hiện khi lập kế hoạch sản xuất mới. Các
              kế hoạch và báo cáo cũ vẫn giữ nguyên xưởng đã chọn.
            </>
          }
          confirmLabel="Tắt xưởng"
          variant="danger"
          isSubmitting={updateStatus.isPending}
          onClose={() => setDeactivating(undefined)}
          onConfirm={() => void changeStatus(deactivating, "inactive")}
        />
      )}
      <ConfirmDialog
        open={blocker.state === "blocked"}
        title="Hủy các thay đổi?"
        description="Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onClose={cancelNavigation}
        onConfirm={discardAndNavigate}
      />
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
