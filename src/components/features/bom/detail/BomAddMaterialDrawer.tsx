import { useEffect, useMemo, useState } from "react";
import { X, Search, AlertCircle } from "lucide-react";
import { useMaterials } from "@/hooks/useMaterials";
import { useMaterialGroups } from "@/hooks/useMaterialGroups";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { DraftMaterial } from "@/hooks/useBomLinesDraft";
import type { Material } from "@/types/material";
import { useDiscardChangesGuard } from "@/hooks/useDiscardChangesGuard";

export interface BomAddMaterialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Vật tư đã có trong bảng (kể cả dòng nháp chưa lưu) — ẩn khỏi danh sách chọn. */
  existingMaterialIds: Set<string>;
  onAdd: (materials: DraftMaterial[]) => void;
}

const PAGE_SIZE = 50;

export function BomAddMaterialDrawer({
  isOpen,
  onClose,
  existingMaterialIds,
  onAdd,
}: BomAddMaterialDrawerProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "selected">("catalog");
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selected, setSelected] = useState<Map<string, Material>>(new Map());
  const { requestClose, discardDialog } = useDiscardChangesGuard(selected.size > 0, onClose);

  const debouncedSearch = useDebouncedValue(materialSearch.trim(), 300);

  const {
    data: materialResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useMaterials(
    {
      search: debouncedSearch || undefined,
      materialGroupId: selectedGroupId === "all" ? undefined : selectedGroupId,
      status: "active",
      limit: PAGE_SIZE,
    },
    { enabled: isOpen },
  );
  const { data: groupResponse } = useMaterialGroups(
    { status: "active", limit: 100 },
    { enabled: isOpen },
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab("catalog");
      setMaterialSearch("");
      setSelectedGroupId("all");
      setSelected(new Map());
    }
  }, [isOpen]);

  const groups = groupResponse?.data ?? [];

  const catalog = useMemo(
    () => (materialResponse?.data ?? []).filter((m) => !existingMaterialIds.has(m.id)),
    [materialResponse, existingMaterialIds],
  );
  const hiddenCount = (materialResponse?.data.length ?? 0) - catalog.length;
  const total = materialResponse?.meta.total ?? 0;
  const visible = activeTab === "selected" ? Array.from(selected.values()) : catalog;

  if (!isOpen) return null;

  const toggle = (material: Material) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(material.id)) next.delete(material.id);
      else next.set(material.id, material);
      return next;
    });
  };

  const handleAdd = () => {
    if (selected.size === 0) return;
    onAdd(
      Array.from(selected.values()).map((m) => ({
        id: m.id,
        materialCode: m.materialCode,
        materialName: m.materialName,
        materialGroupName: m.materialGroupName,
        defaultUnitName: m.defaultUnitName,
      })),
    );
    onClose();
  };

  const loadError =
    (error as { response?: { data?: { message?: string } }; message?: string } | null)?.response
      ?.data?.message ||
    (error as { message?: string } | null)?.message ||
    "Không thể tải danh mục vật tư.";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={requestClose} />

      <aside
        className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-[#EAECF0] bg-white shadow-xl transition-all duration-300 sm:w-[480px] dark:border-gray-800 dark:bg-gray-900"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#EAECF0] px-5 dark:border-gray-800">
          <h2 className="truncate text-base font-bold text-[#101828] dark:text-white">
            Thêm vật tư
          </h2>
          <button
            type="button"
            onClick={requestClose}
            className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex shrink-0 border-b border-[#EAECF0] px-5 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`mr-6 cursor-pointer border-b-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === "catalog"
                ? "dark:border-brand-400 dark:text-brand-400 border-[#465FFF] text-[#465FFF]"
                : "border-transparent text-[#667085] hover:text-[#101828] dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Chọn từ danh mục
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("selected")}
            className={`cursor-pointer border-b-2 py-3 text-sm font-semibold transition-colors ${
              activeTab === "selected"
                ? "dark:border-brand-400 dark:text-brand-400 border-[#465FFF] text-[#465FFF]"
                : "border-transparent text-[#667085] hover:text-[#101828] dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Đã chọn ({selected.size})
          </button>
        </div>

        {activeTab === "catalog" && (
          <div className="dark:bg-gray-850/40 flex shrink-0 flex-col gap-2.5 border-b border-[#EAECF0] bg-gray-50/50 p-4 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Tìm mã hoặc tên vật tư..."
                className="h-10 w-full rounded-lg border border-[#EAECF0] bg-white pr-8 pl-9 text-sm text-[#101828] placeholder-[#98A2B3] focus:border-[#465FFF] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              {materialSearch && (
                <button
                  type="button"
                  onClick={() => setMaterialSearch("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="h-9 w-full cursor-pointer rounded-lg border border-[#EAECF0] bg-white px-2.5 text-xs font-semibold text-[#344054] shadow-2xs focus:border-[#465FFF] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value="all">Tất cả nhóm</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-1 flex-col justify-between overflow-hidden">
          <div className="flex-1 space-y-2 overflow-y-auto p-5">
            {activeTab === "catalog" && isLoading ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Đang tải danh mục vật tư...
              </div>
            ) : activeTab === "catalog" && isError ? (
              <div
                role="alert"
                className="flex flex-col items-center gap-3 p-8 text-center text-xs text-rose-600 dark:text-rose-300"
              >
                <AlertCircle className="h-5 w-5" />
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30"
                >
                  Thử tải lại
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                {activeTab === "selected"
                  ? "Chưa có vật tư nào được chọn"
                  : hiddenCount > 0
                    ? "Mọi vật tư phù hợp đều đã có trong bảng"
                    : "Không tìm thấy vật tư nào phù hợp"}
              </div>
            ) : (
              visible.map((material) => {
                const isChecked = selected.has(material.id);
                return (
                  <div
                    key={material.id}
                    onClick={() => toggle(material)}
                    className={`flex min-h-[56px] cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                      isChecked
                        ? "dark:border-brand-800 dark:bg-brand-950/30 border-[#DCE3FC] bg-[#F0F3FF]"
                        : "border-[#EAECF0] bg-white hover:bg-gray-50/80 dark:border-gray-800 dark:bg-gray-900"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(material)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4.5 w-4.5 shrink-0 cursor-pointer rounded border-gray-300 accent-[#465FFF]"
                        aria-label={`Chọn ${material.materialName}`}
                      />
                      <div className="flex min-w-0 flex-col">
                        <div className="truncate text-sm">
                          <span className="font-bold text-[#101828] dark:text-white">
                            {material.materialCode}
                          </span>{" "}
                          <span className="ml-1 font-medium text-gray-700 dark:text-gray-300">
                            {material.materialName}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[#667085] dark:text-gray-400">
                          {material.materialGroupName || "Vật tư"} ·{" "}
                          {material.defaultUnitName || "Cái"}
                        </div>
                      </div>
                    </div>

                    {activeTab === "selected" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(material);
                        }}
                        className="cursor-pointer rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {activeTab === "catalog" && total > PAGE_SIZE && (
              <p className="px-1 pt-2 text-center text-[11px] text-gray-400">
                Đang hiện {PAGE_SIZE} trong {total} vật tư — nhập từ khóa để thu hẹp.
              </p>
            )}
          </div>

          <div className="flex h-16 shrink-0 items-center justify-between border-t border-[#EAECF0] bg-white px-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="text-sm font-semibold text-[#101828] dark:text-gray-200">
              {selected.size > 0 ? (
                <span>{selected.size} vật tư đã chọn</span>
              ) : (
                <span className="text-[#667085]">Chưa chọn vật tư nào</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={requestClose}
                className="h-10 cursor-pointer rounded-lg border border-[#EAECF0] px-4 text-xs font-semibold text-[#344054] hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={selected.size === 0}
                onClick={handleAdd}
                className="h-10 cursor-pointer rounded-lg bg-[#465FFF] px-5 text-xs font-bold text-white shadow-xs hover:bg-[#3b51db] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selected.size > 0 ? `Thêm ${selected.size} vật tư` : "Thêm vật tư"}
              </button>
            </div>
          </div>
        </div>
      </aside>
      {discardDialog}
    </>
  );
}
