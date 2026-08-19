import { Button, Modal } from "@/components/shared";
import type { Material } from "../types/material.types";

type Props = {
  material: Material;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function MaterialStatusConfirmDialog({ material, isSubmitting, onClose, onConfirm }: Props) {
  const nextStatus = material.status === "active" ? "inactive" : "active";
  const action = nextStatus === "active" ? "Activate" : "Deactivate";
  return (
    <Modal
      open
      title={`${action} material`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={isSubmitting} onClick={onConfirm}>
            {action}
          </Button>
        </>
      }
    >
      <p className="text-theme-sm text-gray-600 dark:text-gray-300">
        {action} {material.materialName}?
      </p>
    </Modal>
  );
}
