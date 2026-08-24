import { useEffect, useState } from "react";
import { StageGroupForm } from "@/components/features/stage-groups/StageGroupForm";
import { StageGroupTable } from "@/components/features/stage-groups/StageGroupTable";
import { StageGroupToolbar } from "@/components/features/stage-groups/StageGroupToolbar";
import { Alert, Button, Modal, PageHeader, Pagination, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { useStages } from "@/hooks/useStages";
import {
  useCreateStageGroup,
  useStageGroup,
  useStageGroups,
  useUpdateStageGroup,
  useUpdateStageGroupStatus,
} from "@/hooks/useStageGroups";
import { useStageGroupListView } from "@/hooks/useStageGroupListView";
import { useToast } from "@/hooks/useToast";
import { PlusIcon } from "@/icons";
import { getApiError } from "@/lib/apiError";
import type { Stage } from "@/types/stage";
import type { StageGroupInput, StageGroupStatus, StageGroupSummary } from "@/types/stage-group";

const emptyGroups: StageGroupSummary[] = [];
const emptyStages: Stage[] = [];

export default function StageGroupListPage() {
  const [editing, setEditing] = useState<"create" | string>();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const list = useStageGroups();
  const activeStages = useStages({ status: "active" });
  const detail = useStageGroup(editing && editing !== "create" ? editing : undefined);
  const create = useCreateStageGroup();
  const update = useUpdateStageGroup();
  const updateStatus = useUpdateStageGroupStatus();
  const groups = list.data ?? emptyGroups;
  const listView = useStageGroupListView(groups);

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
                onToggleStatus={() => {}}
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
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                onEdit={startEdit}
                onToggleStatus={(group) => void toggleStatus(group)}
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
          stages={activeStages.data ?? emptyStages}
          isSubmitting={create.isPending}
          serverError={
            create.error ? getApiError(create.error, "Không thể tạo nhóm công đoạn.") : undefined
          }
          stageOptionsError={
            activeStages.error
              ? getApiError(activeStages.error, "Không thể tải danh sách công đoạn.").message
              : undefined
          }
          onClose={closeForm}
          onSubmit={(input) => void saveForm(input)}
          onDirtyChange={setIsFormDirty}
        />
      )}
      {editing && editing !== "create" && detail.isLoading && (
        <Modal open title="Chỉnh sửa nhóm công đoạn" onClose={closeForm}>
          <div className="py-8 text-center text-sm text-gray-500" aria-busy="true">
            Đang tải thông tin nhóm công đoạn...
          </div>
        </Modal>
      )}
      {editing && editing !== "create" && detail.isError && (
        <Modal open title="Không thể tải nhóm công đoạn" onClose={closeForm}>
          <Alert variant="error" title="Không thể tải dữ liệu chỉnh sửa">
            {getApiError(detail.error, "Không thể tải thông tin nhóm công đoạn.").message}
          </Alert>
        </Modal>
      )}
      {editing && editing !== "create" && detail.data && (
        <StageGroupForm
          mode="edit"
          group={detail.data}
          stages={activeStages.data ?? emptyStages}
          isSubmitting={update.isPending}
          serverError={
            update.error
              ? getApiError(update.error, "Không thể cập nhật nhóm công đoạn.")
              : undefined
          }
          stageOptionsError={
            activeStages.error
              ? getApiError(activeStages.error, "Không thể tải danh sách công đoạn.").message
              : undefined
          }
          onClose={closeForm}
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
    </>
  );
}
