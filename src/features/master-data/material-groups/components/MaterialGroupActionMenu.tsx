import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/shared";
import { CheckLineIcon, CloseLineIcon, MoreDotIcon, PencilIcon, TrashBinIcon } from "@/icons";
import type { MaterialGroup } from "../types/material-group.types";

type MaterialGroupActionMenuProps = {
  materialGroup: MaterialGroup;
  onEdit: (materialGroup: MaterialGroup) => void;
  onStatus: (materialGroup: MaterialGroup) => void;
  onDelete: (materialGroup: MaterialGroup) => void;
};

export function MaterialGroupActionMenu({
  materialGroup,
  onEdit,
  onStatus,
  onDelete,
}: MaterialGroupActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = `material-group-actions-${materialGroup.id}`;
  const statusLabel = materialGroup.status === "active" ? "Ngừng hoạt động" : "Kích hoạt";

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target))
        setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const closeOnViewportChange = () => setOpen(false);

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnViewportChange);
    window.addEventListener("scroll", closeOnViewportChange, true);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnViewportChange);
      window.removeEventListener("scroll", closeOnViewportChange, true);
    };
  }, [open]);

  const runAction = (action: (group: MaterialGroup) => void) => {
    setOpen(false);
    action(materialGroup);
  };

  return (
    <div className="inline-flex justify-end">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Mở thao tác cho nhóm ${materialGroup.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className="focus:ring-brand-500/20 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:ring-3 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        onClick={() => {
          const rect = triggerRef.current?.getBoundingClientRect();
          if (rect) setPosition({ top: rect.top + rect.height / 2, left: rect.left - 8 });
          setOpen((current) => !current);
        }}
      >
        <MoreDotIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={`Thao tác cho nhóm ${materialGroup.name}`}
            style={position}
            className="shadow-theme-lg fixed z-50 flex w-48 -translate-x-full -translate-y-1/2 flex-col rounded-lg border border-gray-200 bg-white p-1.5 text-left whitespace-normal dark:border-gray-700 dark:bg-gray-900"
          >
            <Button
              role="menuitem"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => runAction(onEdit)}
            >
              <PencilIcon className="h-4 w-4" aria-hidden="true" />
              Sửa
            </Button>
            <Button
              role="menuitem"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => runAction(onStatus)}
            >
              {materialGroup.status === "active" ? (
                <CloseLineIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckLineIcon className="h-4 w-4" aria-hidden="true" />
              )}
              {statusLabel}
            </Button>
            <Button
              role="menuitem"
              variant="ghost"
              size="sm"
              className="text-error-600 hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10 w-full justify-start"
              onClick={() => runAction(onDelete)}
            >
              <TrashBinIcon className="h-4 w-4" aria-hidden="true" />
              Xóa
            </Button>
          </div>,
          document.body,
        )}
    </div>
  );
}
