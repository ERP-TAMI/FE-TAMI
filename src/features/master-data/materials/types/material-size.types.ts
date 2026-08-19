export type MaterialSizeStatus = "active" | "inactive";

export type MaterialSize = {
  id: string;
  materialId: string;
  sizeCode: string;
  barcode: string | null;
  unitCost: number;
  currentStock: number;
  lowStockThreshold: number;
  status: MaterialSizeStatus;
};

export type MaterialSizeInput = Pick<
  MaterialSize,
  "sizeCode" | "barcode" | "unitCost" | "currentStock" | "lowStockThreshold"
>;
