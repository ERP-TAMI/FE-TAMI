import { Button, Modal } from "@/components/shared";
import type { Material } from "@/types/material";

export function MaterialDetail({
  material,
  onClose,
  onEdit,
}: {
  material: Material;
  onClose: () => void;
  onEdit: () => void;
}) {
  const fields = [
    ["Mã vật tư", material.materialCode],
    ["Tên vật tư", material.materialName],
    ["Nhóm vật tư", material.materialGroupName ?? "—"],
    [
      "Đơn vị tính",
      material.defaultUnitName ? `${material.defaultUnitCode} — ${material.defaultUnitName}` : "—",
    ],
    ["Yield mặc định (%)", material.defaultYieldPct],
    ["Đơn giá gần nhất", material.lastUnitCost],
    ["Tồn kho hiện tại", material.currentStock],
    ["Ngưỡng tồn thấp", material.lowStockThreshold],
    ["Trạng thái", material.status === "active" ? "Đang sử dụng" : "Đã tắt"],
  ];
  return (
    <Modal
      open
      title="Chi tiết vật tư"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={onEdit}>Chỉnh sửa</Button>
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
