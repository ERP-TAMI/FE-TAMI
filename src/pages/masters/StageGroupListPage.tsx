import { useCallback, useEffect, useState } from "react";
import { useBlocker, type BlockerFunction } from "react-router-dom";
import { StageGroupForm } from "@/components/features/stage-groups/StageGroupForm";
import { StageGroupTable } from "@/components/features/stage-groups/StageGroupTable";
import { StageGroupSsvForm } from "@/components/features/stage-groups/StageGroupSsvForm";
import { StageGroupToolbar } from "@/components/features/stage-groups/StageGroupToolbar";
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
import type {
  StageGroupInput,
  StageGroupItemInput,
  StageGroupStatus,
  StageGroupSummary,
} from "@/types/stage-group";

const emptyGroups: StageGroupSummary[] = [];

export default function StageGroupListPage() {
  const [editing, setEditing] = useState<"create" | string>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [discardCloseRequested, setDiscardCloseRequested] = useState(false);
  const [deleting, setDeleting] = useState<StageGroupSummary>();
  const [ssvEditing, setSsvEditing] = useState<string>();
  const { toast, showToast, hideToast } = useToast();
  const list = useStageGroups();
  const detailId = editing && editing !== "create" ? editing : ssvEditing;
  const detail = useStageGroup(detailId);
  const create = useCreateStageGroup();
  const update = useUpdateStageGroup();
  const updateStatus = useUpdateStageGroupStatus();
  const remove = useDeleteStageGroup();
  const groups = list.data ?? emptyGroups;
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
  const saveGroupItems = async (id: string, items: StageGroupItemInput[]): Promise<boolean> => {
    try {
      await update.mutateAsync({ id, input: { items } });
      showToast("Đã cập nhật công đoạn con trong nhóm.");
      return true;
    } catch (error) {
      showToast(getApiError(error, "Không thể cập nhật công đoạn trong nhóm.").message, "error");
      return false;
    }
  };
  const saveGroupSsv = async (items: StageGroupItemInput[]) => {
    if (!ssvEditing) return;
    try {
      await update.mutateAsync({ id: ssvEditing, input: { items } });
      showToast(`Đã cập nhật SSV cho ${items.length} công đoạn con.`);
      setSsvEditing(undefined);
    } catch (error) {
      showToast(getApiError(error, "Không thể cập nhật SSV công đoạn con.").message, "error");
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
                onEdit={() => {}}
                onEditSsv={() => {}}
                onDelete={() => {}}
                onToggleStatus={() => {}}
                onSaveItems={async () => false}
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
                isSavingItems={update.isPending}
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                onEdit={startEdit}
                onEditSsv={(group) => setSsvEditing(group.id)}
                onDelete={setDeleting}
                onToggleStatus={(group) => void toggleStatus(group)}
                onSaveItems={saveGroupItems}
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
          isSubmitting={create.isPending}
          serverError={
            create.error ? getApiError(create.error, "Không thể tạo nhóm công đoạn.") : undefined
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
          isSubmitting={update.isPending}
          serverError={
            update.error
              ? getApiError(update.error, "Không thể cập nhật nhóm công đoạn.")
              : undefined
          }
          onClose={requestCloseForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsFormDirty}
        />
      )}
      {ssvEditing && detail.isLoading && (
        <Modal open title="Sửa SSV công đoạn con" onClose={() => setSsvEditing(undefined)}>
          <div className="py-8 text-center text-sm text-gray-500" aria-busy="true">
            Đang tải danh sách công đoạn con...
          </div>
        </Modal>
      )}
      {ssvEditing && detail.isError && (
        <Modal open title="Không thể tải SSV" onClose={() => setSsvEditing(undefined)}>
          <Alert variant="error" title="Không thể tải danh sách công đoạn con">
            {getApiError(detail.error, "Không thể tải dữ liệu SSV.").message}
          </Alert>
        </Modal>
      )}
      {ssvEditing && detail.data && (
        <StageGroupSsvForm
          group={detail.data}
          isSubmitting={update.isPending}
          onClose={() => setSsvEditing(undefined)}
          onSubmit={(items) => void saveGroupSsv(items)}
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
