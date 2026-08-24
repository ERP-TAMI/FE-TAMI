import { useEffect, useMemo, useState } from "react";
import { Alert, Button, ConfirmDialog, PageHeader, Pagination, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { StageForm } from "@/components/features/stages/StageForm";
import { StageTable } from "@/components/features/stages/StageTable";
import { StageToolbar } from "@/components/features/stages/StageToolbar";
import {
  useCreateStage,
  useDeleteStage,
  useStages,
  useUpdateStage,
  useUpdateStageSsvBulk,
  useUpdateStageStatus,
} from "@/hooks/useStages";
import { useStageListView } from "@/hooks/useStageListView";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { PlusIcon } from "@/icons";
import { STAGE_SSV_PATTERN, type Stage, type StageInput, type StageStatus } from "@/types/stage";

const emptyStages: Stage[] = [];

export default function StageListPage() {
  const [editing, setEditing] = useState<Stage | "create" | undefined>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [bulkValues, setBulkValues] = useState<Record<string, string> | null>(null);
  const [discardBulkDialogOpen, setDiscardBulkDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Stage>();
  const { toast, showToast, hideToast } = useToast();
  const list = useStages();
  const create = useCreateStage();
  const update = useUpdateStage();
  const updateStatus = useUpdateStageStatus();
  const updateSsvBulk = useUpdateStageSsvBulk();
  const remove = useDeleteStage();
  const stages = list.data ?? emptyStages;
  const listView = useStageListView(stages);

  const changedSsvItems = useMemo(() => {
    if (!bulkValues) return [];
    return stages
      .filter((stage) => bulkValues[stage.id] !== undefined && bulkValues[stage.id] !== stage.ssv)
      .map((stage) => ({ id: stage.id, ssv: bulkValues[stage.id] }));
  }, [bulkValues, stages]);
  const bulkErrors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(bulkValues ?? {}).map(([id, value]) => [
          id,
          STAGE_SSV_PATTERN.test(value.trim()) ? undefined : "SSV không hợp lệ",
        ]),
      ),
    [bulkValues],
  );
  const hasBulkErrors = Object.values(bulkErrors).some(Boolean);
  const hasUnsavedChanges = isFormDirty || changedSsvItems.length > 0;

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const closeForm = () => {
    setEditing(undefined);
    setIsFormDirty(false);
  };
  const saveForm = async (input: StageInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input);
      else if (editing) {
        const { stageCode: _stageCode, ...updateInput } = input;
        await update.mutateAsync({ id: editing.id, input: updateInput });
      }
      showToast(editing === "create" ? "Đã tạo công đoạn." : "Đã cập nhật công đoạn.");
      closeForm();
    } catch {
      // The form displays the mutation error without discarding user input.
    }
  };
  const toggleStatus = async (stage: Stage) => {
    const status: StageStatus = stage.status === "active" ? "inactive" : "active";
    try {
      await updateStatus.mutateAsync({ id: stage.id, status });
      showToast(status === "active" ? "Đã bật công đoạn." : "Đã tắt công đoạn.");
    } catch (error) {
      showToast(getApiError(error, "Không thể đổi trạng thái công đoạn.").message, "error");
    }
  };
  const startBulkEdit = () => {
    setBulkValues(Object.fromEntries(stages.map((stage) => [stage.id, stage.ssv])));
  };
  const cancelBulkEdit = () => {
    if (changedSsvItems.length > 0) setDiscardBulkDialogOpen(true);
    else setBulkValues(null);
  };
  const saveBulkSsv = async () => {
    if (changedSsvItems.length === 0 || hasBulkErrors) return;
    try {
      await updateSsvBulk.mutateAsync({ items: changedSsvItems });
      setBulkValues(null);
      showToast(`Đã cập nhật SSV cho ${changedSsvItems.length} công đoạn.`);
    } catch (error) {
      showToast(getApiError(error, "Không thể cập nhật SSV.").message, "error");
    }
  };
  const deleteStage = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      showToast("Đã xóa công đoạn.");
      setDeleting(undefined);
    } catch (error) {
      showToast(getApiError(error, "Không thể xóa công đoạn.").message, "error");
    }
  };

  return (
    <>
      <PageMeta title="Giai đoạn công đoạn | TAMI ERP" description="Quản lý danh mục công đoạn" />
      <section aria-labelledby="page-title" className="space-y-4">
        <PageHeader
          breadcrumb={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Dữ liệu chung" },
            { label: "Giai đoạn công đoạn" },
          ]}
          title="Giai đoạn công đoạn"
          stats={[
            { label: "công đoạn", value: stages.length },
            {
              label: "đang sử dụng",
              value: stages.filter((stage) => stage.status === "active").length,
              tone: "success",
            },
          ]}
          action={
            bulkValues
              ? undefined
              : {
                  label: "Tạo công đoạn mới",
                  onClick: () => setEditing("create"),
                  icon: <PlusIcon className="h-4 w-4" aria-hidden="true" />,
                }
          }
        />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <StageToolbar
            search={listView.search}
            status={listView.status}
            bulkMode={Boolean(bulkValues)}
            canSaveBulk={changedSsvItems.length > 0 && !hasBulkErrors}
            isSavingBulk={updateSsvBulk.isPending}
            onSearchChange={listView.setSearch}
            onStatusChange={listView.setStatus}
            onStartBulk={startBulkEdit}
            onSaveBulk={() => void saveBulkSsv()}
            onCancelBulk={cancelBulkEdit}
          />
          {list.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách công đoạn">
              <StageTable
                stages={emptyStages}
                loading
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleStatus={() => {}}
              />
            </div>
          )}
          {list.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách công đoạn">
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
              <StageTable
                stages={listView.paginatedStages}
                bulkMode={Boolean(bulkValues)}
                bulkValues={bulkValues ?? undefined}
                bulkErrors={bulkErrors}
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                onEdit={setEditing}
                onDelete={setDeleting}
                onToggleStatus={(stage) => void toggleStatus(stage)}
                onBulkValueChange={(id, value) =>
                  setBulkValues((current) => (current ? { ...current, [id]: value } : current))
                }
              />
              <Pagination
                page={listView.page}
                pageSize={listView.pageSize}
                totalItems={listView.totalItems}
                totalPages={listView.totalPages}
                itemLabel="công đoạn"
                onPageChange={listView.setPage}
              />
            </>
          )}
        </div>
      </section>

      {editing && (
        <StageForm
          mode={editing === "create" ? "create" : "edit"}
          stage={editing === "create" ? undefined : editing}
          isSubmitting={create.isPending || update.isPending}
          serverError={
            (create.error ?? update.error)
              ? getApiError(create.error ?? update.error, "Không thể lưu công đoạn.")
              : undefined
          }
          onClose={closeForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsFormDirty}
        />
      )}
      <ConfirmDialog
        open={discardBulkDialogOpen}
        title="Hủy sửa SSV?"
        description="Các giá trị SSV chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onClose={() => setDiscardBulkDialogOpen(false)}
        onConfirm={() => {
          setDiscardBulkDialogOpen(false);
          setBulkValues(null);
        }}
      />
      {deleting && (
        <ConfirmDialog
          open
          title="Xóa công đoạn"
          description={
            <>
              Bạn có chắc muốn xóa "{deleting.stageName}"? Chỉ có thể xóa khi chưa có dữ liệu
              nghiệp vụ nào tham chiếu.
            </>
          }
          confirmLabel="Xóa"
          variant="danger"
          isSubmitting={remove.isPending}
          onClose={() => setDeleting(undefined)}
          onConfirm={() => void deleteStage()}
        />
      )}
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
    </>
  );
}
