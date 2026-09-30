import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { TimeIcon } from "@/icons";
import { EntityHistoryDrawer } from "./EntityHistoryDrawer";

export interface EntityHistoryButtonProps {
  aggregateType: string;
  /** Lịch sử của đúng 1 bản ghi. Bỏ trống nếu dùng parentId. */
  aggregateId?: string;
  /** Lịch sử của mọi bản ghi con thuộc 1 cha (VD mọi công đoạn của 1 Style). */
  parentId?: string;
  title?: string;
  label?: string;
}

/** Nút mở lịch sử thay đổi — đặt ở toolbar của 1 tab/khu vực để xem "ai sửa gì lúc mấy giờ". */
export function EntityHistoryButton({
  aggregateType,
  aggregateId,
  parentId,
  title,
  label = "Lịch sử",
}: EntityHistoryButtonProps) {
  const [open, setOpen] = useState(false);

  if (!aggregateId && !parentId) return null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <TimeIcon className="h-4 w-4" />
        {label}
      </Button>
      <EntityHistoryDrawer
        open={open}
        onClose={() => setOpen(false)}
        aggregateType={aggregateType}
        aggregateId={aggregateId}
        parentId={parentId}
        title={title}
      />
    </>
  );
}
