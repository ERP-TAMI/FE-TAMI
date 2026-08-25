import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlocker, type BlockerFunction } from "react-router-dom";
import { StageGroupForm } from "@/components/features/stage-groups/StageGroupForm";
import { StageGroupTable } from "@/components/features/stage-groups/StageGroupTable";
import { StageGroupToolbar } from "@/components/features/stage-groups/StageGroupToolbar";
import { StageForm } from "@/components/features/stages/StageForm";
import {
  Alert,
  Button,
  ConfirmDialog,
  Modal,
  PageHeader,
  Pagination,
  Toast,
} from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { useStages, useUpdateStage, useUpdateStageStatus } from "@/hooks/useStages";
import {
  useCreateStageGroup,
  useDeleteStageGroup,
  useStageGroup,
  useStageGroups,
  useUpdateStageGroup,
  useUpdateStageGroupStatus,
} from "@/hooks/useStageGroups";
import { useStageGroupListView } from "@/hooks/useStageGroupListView";
import { useToast } from "@/hooks/useToast";
import { PlusIcon } from "@/icons";
import { getApiError } from "@/lib/apiError";
import type { Stage, StageInput, StageStatus } from "@/types/stage";
import type {
  StageGroupInput,
  StageGroupItemInput,
  StageGroupStatus,
  StageGroupSummary,
} from "@/types/stage-group";

const emptyGroups: StageGroupSummary[] = [];
const emptyStages: Stage[] = [];
const emptyStagesById = new Map<string, Stage>();

export default function StageGroupListPage() {
  const [editing, setEditing] = useState<"create" | string>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [discardCloseRequested, setDiscardCloseRequested] = useState(false);
  const [deleting, setDeleting] = useState<StageGroupSummary>();
  const [editingStage, setEditingStage] = useState<Stage>();
  const { toast, showToast, hideToast } = useToast();
  const list = useStageGroups();
  const stageCatalog = useStages();
  const detail = useStageGroup(editing && editing !== "create" ? editing : undefined);
  const create = useCreateStageGroup();
  const update = useUpdateStageGroup();
  const updateStatus = useUpdateStageGroupStatus();
  const remove = useDeleteStageGroup();
  const updateStage = useUpdateStage();
  const updateStageStatus = useUpdateStageStatus();
  const groups = list.data ?? emptyGroups;
  const activeStages = useMemo(
    () => stageCatalog.data?.filter((stage) => stage.status === "active") ?? emptyStages,
    [stageCatalog.data],
  );
  const stagesById = useMemo(
    () =>
      stageCatalog.data
        ? new Map(stageCatalog.data.map((stage) => [stage.id, stage]))
        : emptyStagesById,
    [stageCatalog.data],
  );
  const listView = useStageGroupListView(groups);
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
  const requestCloseForm = () => {
    if (isFormDirty) {
      setDiscardCloseRequested(true);
      return;
    }
    closeForm();
  };
  const cancelDiscard = () => {
    setDiscardCloseRequested(false);
    if (blocker.state === "blocked") blocker.reset();
  };
  const confirmDiscard = () => {
    setDiscardCloseRequested(false);
    setIsFormDirty(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }
    closeForm();
  };
  const saveForm = async (input: StageGroupInput) => {
    try {
      if (editing === "create") {
        await create.mutateAsync(input);
      } else if (editing) {
        const { groupCode: _groupCode, ...updateInput } = input;
        await update.mutateAsync({ id: editing, input: updateInput });
      }
      showToast(editing === "create" ? "Đã tạo nhóm công đoạn." : "Đã cập nhật nhóm công đoạn.");
      closeForm();
    } catch {
      // The form keeps user input and displays the mutation error.
    }
  };
  const toggleStatus = async (group: StageGroupSummary) => {
    const status: StageGroupStatus = group.status === "active" ? "inactive" : "active";
    try {
      await updateStatus.mutateAsync({ id: group.id, status });
      showToast(status === "active" ? "Đã bật nhóm công đoạn." : "Đã tắt nhóm công đoạn.");
    } catch (error) {
      showToast(getApiError(error, "Không thể đổi trạng thái nhóm công đoạn.").message, "error");
    }
  };
  const saveGroupItems = async (
    id: string,
    items: StageGroupItemInput[],
    successMessage: string,
  ): Promise<boolean> => {
    try {
      await update.mutateAsync({ id, input: { items } });
      showToast(successMessage);
      return true;
    } catch (error) {
      showToast(getApiError(error, "Không thể cập nhật công đoạn trong nhóm.").message, "error");
      return false;
    }
  };
  const toggleStageStatus = async (stage: Stage) => {
    const status: StageStatus = stage.status === "active" ? "inactive" : "active";
    try {
      await updateStageStatus.mutateAsync({ id: stage.id, status });
      showToast(status === "active" ? "Đã bật công đoạn." : "Đã tắt công đoạn.");
    } catch (error) {
      showToast(getApiError(error, "Không thể đổi trạng thái công đoạn.").message, "error");
    }
  };
  const saveStage = async (input: StageInput) => {
    if (!editingStage) return;
    try {
      await updateStage.mutateAsync({ id: editingStage.id, input });
      showToast("Đã cập nhật công đoạn Master.");
      setEditingStage(undefined);
    } catch {
      // StageForm keeps its values and displays the mutation error.
    }
  };
  const deleteGroup = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      showToast("Đã xóa nhóm công đoạn.");
      setDeleting(undefined);
    } catch (error) {
      showToast(getApiError(error, "Không thể xóa nhóm công đoạn.").message, "error");
    }
  };
  const startEdit = (group: StageGroupSummary) => {
    setIsFormDirty(false);
    setEditing(group.id);
  };

  return (
    <>
      <PageMeta title="Nhóm công đoạn | TAMI ERP" description="Quản lý nhóm công đoạn" />
      <section aria-labelledby="page-title" className="space-y-4">
        <PageHeader
          breadcrumb={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Dữ liệu chung" },
            { label: "Nhóm công đoạn" },
          ]}
          title="Nhóm công đoạn"
          stats={[
            { label: "nhóm", value: groups.length },
            {
              label: "đang sử dụng",
              value: groups.filter((group) => group.status === "active").length,
              tone: "success",
            },
          ]}
          action={{
            label: "Tạo nhóm công đoạn",
            onClick: () => setEditing("create"),
            icon: <PlusIcon className="h-4 w-4" aria-hidden="true" />,
          }}
        />

        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <StageGroupToolbar
            search={listView.search}
            status={listView.status}
            onSearchChange={listView.setSearch}
            onStatusChange={listView.setStatus}
          />
          {list.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách nhóm công đoạn">
              <StageGroupTable
                groups={emptyGroups}
                loading
                stagesById={emptyStagesById}
                onEdit={() => {}}
                onDelete={() => {}}
                onToggleStatus={() => {}}
                onEditStage={() => {}}
                onToggleStageStatus={() => {}}
                onSaveItemSsv={async () => false}
                onRemoveItem={async () => false}
              />
            </div>
          )}
          {list.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách nhóm công đoạn">
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
              <StageGroupTable
                groups={listView.paginatedGroups}
                stagesById={stagesById}
                isSavingItems={update.isPending}
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                togglingStageId={
                  updateStageStatus.isPending ? updateStageStatus.variables?.id : undefined
                }
                onEdit={startEdit}
                onDelete={setDeleting}
                onToggleStatus={(group) => void toggleStatus(group)}
                onEditStage={setEditingStage}
                onToggleStageStatus={(stage) => void toggleStageStatus(stage)}
                onSaveItemSsv={(id, items) =>
                  saveGroupItems(id, items, "Đã cập nhật SSV riêng trong nhóm.")
                }
                onRemoveItem={(id, items) =>
                  saveGroupItems(id, items, "Đã loại công đoạn khỏi nhóm.")
                }
              />
              <Pagination
                page={listView.page}
                pageSize={listView.pageSize}
                totalItems={listView.totalItems}
                totalPages={listView.totalPages}
                itemLabel="nhóm công đoạn"
                onPageChange={listView.setPage}
              />
            </>
          )}
        </div>
      </section>

      {editing === "create" && (
        <StageGroupForm
          mode="create"
          stages={activeStages}
          isSubmitting={create.isPending}
          serverError={
            create.error ? getApiError(create.error, "Không thể tạo nhóm công đoạn.") : undefined
          }
          stageOptionsError={
            stageCatalog.error
              ? getApiError(stageCatalog.error, "Không thể tải danh sách công đoạn.").message
              : undefined
          }
          onClose={requestCloseForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsFormDirty}
        />
      )}
      {editing && editing !== "create" && detail.isLoading && (
        <Modal open title="Chỉnh sửa nhóm công đoạn" onClose={requestCloseForm}>
          <div className="py-8 text-center text-sm text-gray-500" aria-busy="true">
            Đang tải thông tin nhóm công đoạn...
          </div>
        </Modal>
      )}
      {editing && editing !== "create" && detail.isError && (
        <Modal open title="Không thể tải nhóm công đoạn" onClose={requestCloseForm}>
          <Alert variant="error" title="Không thể tải dữ liệu chỉnh sửa">
            {getApiError(detail.error, "Không thể tải thông tin nhóm công đoạn.").message}
          </Alert>
        </Modal>
      )}
      {editing && editing !== "create" && detail.data && (
        <StageGroupForm
          mode="edit"
          group={detail.data}
          stages={activeStages}
          isSubmitting={update.isPending}
          serverError={
            update.error
              ? getApiError(update.error, "Không thể cập nhật nhóm công đoạn.")
              : undefined
          }
          stageOptionsError={
            stageCatalog.error
              ? getApiError(stageCatalog.error, "Không thể tải danh sách công đoạn.").message
              : undefined
          }
          onClose={requestCloseForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsFormDirty}
        />
      )}
      {editingStage && (
        <StageForm
          mode="edit"
          stage={editingStage}
          isSubmitting={updateStage.isPending}
          serverError={
            updateStage.error
              ? getApiError(updateStage.error, "Không thể cập nhật công đoạn Master.")
              : undefined
          }
          onClose={() => {
            setEditingStage(undefined);
            updateStage.reset();
          }}
          onSubmit={(input) => void saveStage(input)}
        />
      )}
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
      <ConfirmDialog
        open={discardCloseRequested || blocker.state === "blocked"}
        title="Hủy các thay đổi?"
        description="Các thông tin nhóm công đoạn chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?"
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục chỉnh sửa"
        variant="danger"
        onClose={cancelDiscard}
        onConfirm={confirmDiscard}
      />
      {deleting && (
        <ConfirmDialog
          open
          title="Xóa nhóm công đoạn"
          description={
            <>
              Bạn có chắc muốn xóa "{deleting.groupName}"? Chỉ có thể xóa khi chưa có dữ liệu nghiệp
              vụ nào tham chiếu.
            </>
          }
          confirmLabel="Xóa"
          variant="danger"
          isSubmitting={remove.isPending}
          onClose={() => setDeleting(undefined)}
          onConfirm={() => void deleteGroup()}
        />
      )}
    </>
  );
}
