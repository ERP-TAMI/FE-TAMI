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
  /** Khớp với size của các nút khác trong cùng toolbar — mỗi khu vực có
   * thể dùng size khác nhau (VD DocumentToolbar dùng nút to hơn "md"). */
  size?: "xs" | "sm" | "md" | "lg";
  /** Khớp font-weight với các nút khác trong cùng toolbar khi chúng không
   * dùng chung component Button (VD DocumentToolbar tự viết className riêng
   * ở font-semibold, trong khi Button mặc định font-medium). */
  className?: string;
}

/** Nút mở lịch sử thay đổi — đặt ở toolbar của 1 tab/khu vực để xem "ai sửa gì lúc mấy giờ". */
export function EntityHistoryButton({
  aggregateType,
  aggregateId,
  parentId,
  title,
  label = "Lịch sử",
  size = "sm",
  className,
}: EntityHistoryButtonProps) {
  const [open, setOpen] = useState(false);

  if (!aggregateId && !parentId) return null;

  return (
    <>
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
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
