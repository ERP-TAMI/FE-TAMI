import type { ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";

export type DetailField = [label: string, value: ReactNode];

type DetailModalProps = {
  title: string;
  fields: DetailField[];
  onClose: () => void;
  onEdit?: () => void;
};

export function DetailModal({ title, fields, onClose, onEdit }: DetailModalProps) {
  return (
    <Modal
      open
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {onEdit && <Button onClick={onEdit}>Chỉnh sửa</Button>}
        </>
      }
    >
      <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="text-theme-sm mt-1 break-words text-gray-900 dark:text-white">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
