import { useEffect, useMemo, useState } from "react";
import { Alert, Button, ConfirmDialog, PageHeader, Pagination, Toast } from "@/components/shared";
import PageMeta from "@/components/shared/PageMeta";
import { MaterialDetail } from "@/components/features/materials/MaterialDetail";
import { MaterialForm } from "@/components/features/materials/MaterialForm";
import { MaterialTable } from "@/components/features/materials/MaterialTable";
import { MaterialToolbar } from "@/components/features/materials/MaterialToolbar";
import {
  useActiveUnits,
  useCreateMaterial,
  useDeleteMaterial,
  useMaterials,
  useUpdateMaterial,
  useUpdateMaterialStatus,
} from "@/hooks/useMaterials";
import { useMaterialGroups } from "@/hooks/useMaterialGroups";
import { useToast } from "@/hooks/useToast";
import { getApiError } from "@/lib/apiError";
import { PlusIcon } from "@/icons";
import type {
  Material,
  MaterialFilters,
  MaterialInput,
  MaterialStatus,
  MaterialUpdateInput,
} from "@/types/material";

type Dialog =
  | { type: "delete"; material: Material }
  | { type: "status"; material: Material; status: MaterialStatus }
  | undefined;

const emptyMaterials: Material[] = [];
const pageSize = 5;

export default function MaterialsPage() {
  const [filters, setFilters] = useState<MaterialFilters>({});
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Material | "create" | undefined>();
  const [viewing, setViewing] = useState<Material>();
  const [dialog, setDialog] = useState<Dialog>();
  const [isDirty, setIsDirty] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const list = useMaterials(filters);
  const groups = useMaterialGroups();
  const activeGroups = useMaterialGroups("active");
  const units = useActiveUnits();
  const create = useCreateMaterial();
  const update = useUpdateMaterial();
  const updateStatus = useUpdateMaterialStatus();
  const remove = useDeleteMaterial();
  const materials = list.data ?? emptyMaterials;
  const totalPages = Math.max(1, Math.ceil(materials.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return materials.slice(start, start + pageSize);
  }, [currentPage, materials]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  const changeFilters = (next: Partial<MaterialFilters>) => {
    setFilters((current) => {
      const merged = { ...current, ...next };
      return Object.fromEntries(
        Object.entries(merged).filter(([, value]) => value),
      ) as MaterialFilters;
    });
    setPage(1);
  };

  const closeForm = () => {
    setEditing(undefined);
    setIsDirty(false);
    create.reset();
    update.reset();
  };

  const saveForm = async (input: MaterialInput | MaterialUpdateInput) => {
    try {
      if (editing === "create") await create.mutateAsync(input as MaterialInput);
      else if (editing) {
        await update.mutateAsync({ id: editing.id, input: input as MaterialUpdateInput });
      }
      showToast(editing === "create" ? "Đã tạo vật tư." : "Đã cập nhật vật tư.");
      closeForm();
    } catch {
      // The form displays the normalized API error.
    }
  };

  const confirmDialog = async () => {
    if (!dialog) return;
    try {
      if (dialog.type === "delete") {
        await remove.mutateAsync(dialog.material.id);
        showToast("Đã xóa vật tư.");
      } else {
        await updateStatus.mutateAsync({ id: dialog.material.id, status: dialog.status });
        showToast(dialog.status === "active" ? "Đã kích hoạt vật tư." : "Đã vô hiệu hóa vật tư.");
      }
      setDialog(undefined);
    } catch (error) {
      showToast(
        getApiError(
          error,
          dialog.type === "delete" ? "Không thể xóa vật tư." : "Không thể đổi trạng thái vật tư.",
        ).message,
        "error",
      );
    }
  };

  const requestStatusChange = (material: Material) => {
    const status: MaterialStatus = material.status === "active" ? "inactive" : "active";
    setDialog({ type: "status", material, status });
  };

  return (
    <>
      <PageMeta
        title="Vật tư - Phụ liệu | TAMI ERP"
        description="Quản lý danh mục vật tư và phụ liệu"
      />
      <section aria-labelledby="page-title" className="space-y-4">
        <PageHeader
          breadcrumb={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Dữ liệu chung" },
            { label: "Vật tư - Phụ liệu" },
          ]}
          title="Vật tư - Phụ liệu"
          action={{
            label: "Tạo vật tư mới",
            onClick: () => setEditing("create"),
            icon: <PlusIcon className="h-4 w-4" aria-hidden="true" />,
          }}
        />
        <div className="shadow-theme-xs overflow-visible rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <MaterialToolbar
            search={filters.search ?? ""}
            materialGroupId={filters.materialGroupId ?? ""}
            status={filters.status ?? ""}
            materialGroups={groups.data ?? []}
            onSearchChange={(search) => changeFilters({ search })}
            onMaterialGroupChange={(materialGroupId) => changeFilters({ materialGroupId })}
            onStatusChange={(status) => changeFilters({ status: status || undefined })}
          />
          {list.isLoading && (
            <div aria-busy="true" aria-label="Đang tải danh sách vật tư">
              <MaterialTable
                materials={emptyMaterials}
                loading
                onView={() => {}}
                onEdit={() => {}}
                onToggleStatus={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
          {list.isError && (
            <div className="p-6">
              <Alert variant="error" title="Không thể tải danh sách vật tư">
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
              <MaterialTable
                materials={paginatedMaterials}
                togglingId={updateStatus.isPending ? updateStatus.variables?.id : undefined}
                onView={setViewing}
                onEdit={setEditing}
                onToggleStatus={requestStatusChange}
                onDelete={(material) => setDialog({ type: "delete", material })}
              />
              <Pagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={materials.length}
                totalPages={totalPages}
                itemLabel="vật tư"
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </section>

      {viewing && (
        <MaterialDetail
          material={viewing}
          onClose={() => setViewing(undefined)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(undefined);
          }}
        />
      )}
      {editing && (
        <MaterialForm
          mode={editing === "create" ? "create" : "edit"}
          material={editing === "create" ? undefined : editing}
          materialGroups={activeGroups.data ?? []}
          units={units.data ?? []}
          isSubmitting={create.isPending || update.isPending}
          serverError={
            create.error || update.error
              ? getApiError(create.error ?? update.error, "Không thể lưu vật tư. Vui lòng thử lại.")
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
          title={
            dialog.type === "delete"
              ? "Xóa vật tư"
              : dialog.status === "active"
                ? "Kích hoạt vật tư"
                : "Vô hiệu hóa vật tư"
          }
          description={
            dialog.type === "delete" ? (
              <>
                Bạn có chắc muốn xóa "{dialog.material.materialName}"? Chỉ có thể xóa khi vật tư
                chưa được tham chiếu.
              </>
            ) : (
              <>
                Bạn có chắc muốn {dialog.status === "active" ? "kích hoạt" : "vô hiệu hóa"} "
                {dialog.material.materialName}"?
              </>
            )
          }
          confirmLabel={
            dialog.type === "delete"
              ? "Xóa"
              : dialog.status === "active"
                ? "Kích hoạt"
                : "Vô hiệu hóa"
          }
          variant={dialog.type === "delete" ? "danger" : "primary"}
          isSubmitting={dialog.type === "delete" ? remove.isPending : updateStatus.isPending}
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
