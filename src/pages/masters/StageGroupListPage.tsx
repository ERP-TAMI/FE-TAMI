import { useCallback, useEffect, useState } from "react";
import { useBlocker, type BlockerFunction } from "react-router-dom";
import { StageGroupForm } from "@/components/features/stage-groups/StageGroupForm";
import { StageGroupTable } from "@/components/features/stage-groups/StageGroupTable";
import { StageGroupToolbar } from "@/components/features/stage-groups/StageGroupToolbar";
import {
  Alert,
  Button,
  ConfirmDialog,
  DetailModal,
  Modal,
  Pagination,
  Toast,
} from "@/components/shared";
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
  StageGroupListParams,
  StageGroupStatus,
  StageGroupSummary,
} from "@/types/stage-group";

const emptyGroups: StageGroupSummary[] = [];

export default function StageGroupListPage() {
  const [filters, setFilters] = useState<StageGroupListParams>({});
  const [editing, setEditing] = useState<"create" | string>();
  const [viewing, setViewing] = useState<StageGroupSummary>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isSsvEditing, setIsSsvEditing] = useState(false);
  const [isSsvDirty, setIsSsvDirty] = useState(false);
  const [discardCloseRequested, setDiscardCloseRequested] = useState(false);
  const [deleting, setDeleting] = useState<StageGroupSummary>();
  const { toast, showToast, hideToast } = useToast();
  const list = useStageGroups(filters);
  const detail = useStageGroup(editing && editing !== "create" ? editing : undefined);
  const create = useCreateStageGroup();
  const update = useUpdateStageGroup();
  const updateStatus = useUpdateStageGroupStatus();
  const remove = useDeleteStageGroup();
  const groups = list.data ?? emptyGroups;
  const listView = useStageGroupListView(groups);
  const hasUnsavedChanges = isFormDirty || isSsvDirty;
  const shouldBlockNavigation = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
    [hasUnsavedChanges],
  );
  const blocker = useBlocker(shouldBlockNavigation);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const changeFilters = (next: Partial<StageGroupListParams>) => {
    setFilters((current) => {
      const merged = { ...current, ...next };
      return Object.fromEntries(
        Object.entries(merged).filter(([, value]) => value),
      ) as StageGroupListParams;
    });
    listView.setPage(1);
  };
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
    setIsSsvDirty(false);
    setIsSsvEditing(false);
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
        await update.mutateAsync({ id: editing, input });
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
      <section aria-label="Nhóm công đoạn" className="space-y-4">
        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-800">
            <div className="text-theme-xs flex shrink-0 items-center gap-2 rounded-full border border-gray-200/80 bg-gray-100 px-2.5 py-1 font-medium whitespace-nowrap text-gray-500 dark:border-gray-700/80 dark:bg-gray-800/80 dark:text-gray-400">
              <span>{groups.length} nhóm</span>
              <span aria-hidden="true">•</span>
              <span className="text-success-600 dark:text-success-400">
                {groups.filter((group) => group.status === "active").length} đang sử dụng
              </span>
            </div>
            {!isSsvEditing && (
              <Button onClick={() => setEditing("create")}>
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Tạo nhóm công đoạn
              </Button>
            )}
          </div>
          <StageGroupToolbar
            search={filters.search ?? ""}
            status={filters.status ?? ""}
            disabled={isSsvEditing}
            onSearchChange={(search) => changeFilters({ search })}
            onStatusChange={(status) => changeFilters({ status: status || undefined })}
          />
          {list.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách nhóm công đoạn">
              <StageGroupTable
                groups={emptyGroups}
                loading
                onView={() => {}}
                onEdit={() => {}}
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
                onView={setViewing}
                onEdit={startEdit}
                onDelete={setDeleting}
                onToggleStatus={(group) => void toggleStatus(group)}
                onSsvEditingChange={setIsSsvEditing}
                onSsvDirtyChange={setIsSsvDirty}
                onSaveItems={saveGroupItems}
              />
              {!isSsvEditing && (
                <Pagination
                  page={listView.page}
                  pageSize={listView.pageSize}
                  totalItems={listView.totalItems}
                  totalPages={listView.totalPages}
                  itemLabel="nhóm công đoạn"
                  onPageChange={listView.setPage}
                />
              )}
            </>
          )}
        </div>
      </section>

      {viewing && (
        <DetailModal
          title="Chi tiết nhóm công đoạn"
          fields={[
            ["Mã nhóm", viewing.groupCode],
            ["Tên nhóm", viewing.groupName],
            ["Mô tả", viewing.description || "—"],
            ["Số công đoạn", viewing.itemCount],
            ["Trạng thái", viewing.status === "active" ? "Đang sử dụng" : "Đã tắt"],
          ]}
          onClose={() => setViewing(undefined)}
          onEdit={() => {
            startEdit(viewing);
            setViewing(undefined);
          }}
        />
      )}
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
      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={hideToast}
      />
      <ConfirmDialog
        open={discardCloseRequested || blocker.state === "blocked"}
        title="Hủy các thay đổi?"
        description="Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc muốn tiếp tục?"
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
