import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
} from "react";

type DraggableStageGroupRow = {
  fieldId: string;
  position: number;
  itemName: string;
};

type UseStageGroupItemDragProps<Row extends DraggableStageGroupRow> = {
  rows: Row[];
  disabled: boolean;
  onMove: (from: number, to: number) => void;
};

export function useStageGroupItemDrag<Row extends DraggableStageGroupRow>({
  rows,
  disabled,
  onMove,
}: UseStageGroupItemDragProps<Row>) {
  const draggingFieldIdRef = useRef<string | undefined>(undefined);
  const draggingTableRef = useRef<HTMLTableElement | null>(null);
  const dropTargetIndexRef = useRef<number | undefined>(undefined);
  const [draggingFieldId, setDraggingFieldId] = useState<string>();
  const [dropTargetFieldId, setDropTargetFieldId] = useState<string>();

  const resetDrag = useCallback(() => {
    draggingFieldIdRef.current = undefined;
    draggingTableRef.current = null;
    dropTargetIndexRef.current = undefined;
    setDraggingFieldId(undefined);
    setDropTargetFieldId(undefined);
  }, []);

  const handleMouseMove = useCallback(
    (event: globalThis.MouseEvent) => {
      const sourceFieldId = draggingFieldIdRef.current;
      if (disabled || event.buttons !== 1 || !sourceFieldId) return;

      const targetRow = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLTableRowElement>("tbody tr");
      if (!targetRow || targetRow.closest("table") !== draggingTableRef.current) {
        dropTargetIndexRef.current = undefined;
        setDropTargetFieldId(undefined);
        return;
      }

      const targetIndex = targetRow.sectionRowIndex;
      if (targetIndex < 0 || targetIndex >= rows.length) return;

      dropTargetIndexRef.current = targetIndex;
      setDropTargetFieldId(rows[targetIndex]?.fieldId);
    },
    [disabled, rows],
  );

  const finishDrag = useCallback(() => {
    const sourceFieldId = draggingFieldIdRef.current;
    const targetIndex = dropTargetIndexRef.current;
    const sourceIndex = rows.findIndex((item) => item.fieldId === sourceFieldId);

    if (!disabled && sourceIndex >= 0 && targetIndex !== undefined && sourceIndex !== targetIndex) {
      onMove(sourceIndex, targetIndex);
    }
    resetDrag();
  }, [disabled, onMove, resetDrag, rows]);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", finishDrag);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", finishDrag);
    };
  }, [finishDrag, handleMouseMove]);

  const getRowProps = (row: Row): HTMLAttributes<HTMLTableRowElement> => {
    const canDrag = !disabled && rows.length > 1;
    const isDragging = draggingFieldId === row.fieldId;
    const isDropTarget = dropTargetFieldId === row.fieldId && !isDragging;

    return {
      title: canDrag
        ? `Giữ chuột và kéo ${row.itemName || `vị trí ${row.position + 1}`} để đổi thứ tự`
        : disabled
          ? "Hoàn tất chỉnh sửa SSV trước khi kéo"
          : undefined,
      className: `${canDrag ? "cursor-grab select-none active:cursor-grabbing" : ""} ${
        isDragging ? "opacity-50" : ""
      } ${isDropTarget ? "bg-brand-50 dark:bg-brand-500/10" : ""}`,
      onMouseDown: (event: MouseEvent<HTMLTableRowElement>) => {
        const target = event.target as HTMLElement;
        if (!canDrag || target.closest("button, input, select, a")) return;
        event.preventDefault();
        draggingFieldIdRef.current = row.fieldId;
        draggingTableRef.current = event.currentTarget.closest("table");
        setDraggingFieldId(row.fieldId);
      },
    };
  };

  return { getRowProps };
}
