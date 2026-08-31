import { useState, useEffect } from "react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/shared/Button";
import { CheckLineIcon } from "@/icons";
import { stageGroupApi, type StageGroup, type StageGroupSubItem } from "@/api/stage-group.api";

export interface StageGroupPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: StageGroup | null;
  onConfirm: (selectedItems: StageGroupSubItem[]) => void;
  existingStageNames?: string[];
}

export function StageGroupPickerDialog({
  open,
  onOpenChange,
  group,
  onConfirm,
  existingStageNames = [],
}: StageGroupPickerDialogProps) {
  const [activeGroup, setActiveGroup] = useState<StageGroup | null>(group);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open || !group) {
      setActiveGroup(null);
      setSelectedItems({});
      return;
    }

    if (group.items && group.items.length > 0) {
      setActiveGroup(group);
    } else if (group.id) {
      setLoading(true);
      stageGroupApi
        .getStageGroupById(group.id)
        .then((detail) => {
          setActiveGroup(detail);
        })
        .catch((err) => {
          console.error("Failed to load stage group detail", err);
          setActiveGroup(group);
        })
        .finally(() => setLoading(false));
    } else {
      setActiveGroup(group);
    }
  }, [open, group]);

  useEffect(() => {
    if (!activeGroup) {
      setSelectedItems({});
      return;
    }

    const preSelected: Record<string, boolean> = {};
    const items = activeGroup.items || [];
    const normalizedExisting = existingStageNames.map((n) =>
      n.toLowerCase().trim(),
    );

    items.forEach((item) => {
      const normalizedName = item.name?.toLowerCase().trim();
      if (normalizedExisting.includes(normalizedName)) {
        preSelected[item.id] = true;
      }
    });

    setSelectedItems(preSelected);
  }, [activeGroup, existingStageNames]);

  if (!open || !group) return null;

  const currentGroup = activeGroup || group;
  const items = currentGroup.items || [];

  const totalSelectedCount = items.filter((item) => selectedItems[item.id]).length;
  const allSelected = items.length > 0 && totalSelectedCount === items.length;

  function handleToggleAll() {
    if (allSelected) {
      setSelectedItems({});
    } else {
      const newSel: Record<string, boolean> = {};
      items.forEach((item) => {
        newSel[item.id] = true;
      });
      setSelectedItems(newSel);
    }
  }

  function handleToggleItem(id: string) {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function handleConfirm() {
    const selected = items.filter((item) => selectedItems[item.id]);
    onConfirm(selected);
    onOpenChange(false);
  }

  const modalFooter = (
    <div className="flex items-center justify-between w-full">
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        <span>Đã chọn {totalSelectedCount} / {items.length} công đoạn</span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Hủy
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={loading}
        >
          <CheckLineIcon className="w-4 h-4" />
          Cập nhật nhóm ({totalSelectedCount})
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      title={`Sửa công đoạn nhóm: ${currentGroup.name || currentGroup.code || ""}`}
      onClose={() => onOpenChange(false)}
      footer={modalFooter}
    >
      <div className="space-y-3">
        {currentGroup.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {currentGroup.description}
          </p>
        )}

        <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          <input
            type="checkbox"
            id="selectAll"
            checked={allSelected}
            onChange={handleToggleAll}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
            disabled={loading}
          />
          <label
            htmlFor="selectAll"
            className="text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer select-none"
          >
            Chọn tất cả ({items.length} công đoạn)
          </label>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-6">
              Đang tải danh sách công đoạn...
            </p>
          ) : (
            <>
              {items.map((item) => {
                const isChecked = !!selectedItems[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors cursor-pointer select-none ${
                      isChecked
                        ? "bg-brand-50/60 dark:bg-brand-950/40 border-brand-200 dark:border-brand-900 text-brand-900 dark:text-brand-100 font-medium"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0 ml-2">
                      {item.ssv}s
                    </span>
                  </div>
                );
              })}

              {items.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Nhóm này chưa có công đoạn con nào.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
