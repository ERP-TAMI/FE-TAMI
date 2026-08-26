import { useCallback, useEffect, useState } from "react";
import { useBlocker, type BlockerFunction } from "react-router-dom";
import { SizeChartForm } from "@/components/features/size-charts/SizeChartForm";
import { SizeChartTable } from "@/components/features/size-charts/SizeChartTable";
import { SizeChartToolbar } from "@/components/features/size-charts/SizeChartToolbar";
import { Alert, Button, ConfirmDialog, PageHeader, Pagination, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { useSizeChartListView } from "@/hooks/useSizeChartListView";
import {
  useCreateSizeChart,
  useSizeCharts,
  useUpdateSizeChart,
  useUpdateSizeChartStatus,
} from "@/hooks/useSizeCharts";
import { useToast } from "@/hooks/useToast";
import { PlusIcon } from "@/icons";
import { getApiError } from "@/lib/apiError";
import type {
  CreateSizeChartInput,
  SizeChart,
  SizeChartStatus,
  UpdateSizeChartInput,
} from "@/types/size-chart";

const emptySizeCharts: SizeChart[] = [];

export default function SizeChartListPage() {
  const [editing, setEditing] = useState<SizeChart | "create" | undefined>();
  const [deactivating, setDeactivating] = useState<SizeChart>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const list = useSizeCharts();
  const create = useCreateSizeChart();
  const update = useUpdateSizeChart();
  const updateStatus = useUpdateSizeChartStatus();
  const sizeCharts = list.data ?? emptySizeCharts;
  const listView = useSizeChartListView(sizeCharts);
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

  const openForm = (next: SizeChart | "create") => {
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

  const saveForm = async (input: CreateSizeChartInput | UpdateSizeChartInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input as CreateSizeChartInput);
      else if (editing) {
        await update.mutateAsync({ id: editing.id, input: input as UpdateSizeChartInput });
      }
      showToast(editing === "create" ? "Đã tạo bảng Size." : "Đã cập nhật bảng Size.");
      closeForm();
    } catch {
      // Keep the form data and surface the mutation error inside the modal.
    }
  };

  const changeStatus = async (sizeChart: SizeChart, status: SizeChartStatus) => {
    try {
      await updateStatus.mutateAsync({ id: sizeChart.id, status });
      showToast(status === "active" ? "Đã bật bảng Size." : "Đã tắt bảng Size.");
      setDeactivating(undefined);
    } catch (error) {
      showToast(getApiError(error, "Không thể đổi trạng thái bảng Size.").message, "error");
    }
  };

  const toggleStatus = (sizeChart: SizeChart) => {
    if (sizeChart.status === "active") setDeactivating(sizeChart);
    else void changeStatus(sizeChart, "active");
  };

  const formError = editing === "create" ? create.error : editing ? update.error : null;

  return (
    <>
      <PageMeta title="Bảng Size | TAMI ERP" description="Quản lý danh mục bảng Size" />
      <section aria-labelledby="page-title" className="space-y-4">
        <PageHeader
          breadcrumb={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Dữ liệu chung" },
            { label: "Bảng Size" },
          ]}
          title="Bảng Size"
          stats={[
            { label: "bảng", value: sizeCharts.length },
            {
              label: "đang sử dụng",
              value: sizeCharts.filter((sizeChart) => sizeChart.status === "active").length,
              tone: "success",
            },
          ]}
          action={{
            label: "Tạo bảng Size",
            onClick: () => openForm("create"),
            icon: <PlusIcon className="h-4 w-4" aria-hidden="true" />,
          }}
        />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <SizeChartToolbar
            search={listView.search}
            status={listView.status}
            onSearchChange={listView.setSearch}
            onStatusChange={listView.setStatus}
          />

          {list.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách bảng Size">
              <SizeChartTable
                sizeCharts={emptySizeCharts}
                loading
                onEdit={() => {}}
                onToggleStatus={() => {}}
              />
            </div>
          )}
          {list.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách bảng Size">
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
              <SizeChartTable
                sizeCharts={listView.paginatedSizeCharts}
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                onEdit={openForm}
                onToggleStatus={toggleStatus}
              />
              <Pagination
                page={listView.page}
                pageSize={listView.pageSize}
                totalItems={listView.totalItems}
                totalPages={listView.totalPages}
                itemLabel="bảng Size"
                onPageChange={listView.setPage}
              />
            </>
          )}
        </div>
      </section>

      {editing && (
        <SizeChartForm
          mode={editing === "create" ? "create" : "edit"}
          sizeChart={editing === "create" ? undefined : editing}
          isSubmitting={create.isPending || update.isPending}
          serverError={formError ? getApiError(formError, "Không thể lưu bảng Size.") : undefined}
          onClose={closeForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsFormDirty}
        />
      )}
      {deactivating && (
        <ConfirmDialog
          open
          title="Tắt bảng Size?"
          description={
            <>
              Bảng "{deactivating.name}" sẽ không còn xuất hiện khi tạo dữ liệu nghiệp vụ mới. PO và
              tài liệu lịch sử vẫn giữ nguyên nhãn Size đã lưu.
            </>
          }
          confirmLabel="Tắt bảng Size"
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
