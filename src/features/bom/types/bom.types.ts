export type BomMaterialOption = {
  id: string;
  materialCode: string;
  materialName: string;
};

export type BomLine = {
  id: string;
  billOfMaterialId: string;
  materialId: string;
  materialNameSnapshot: string;
  materialGroupSnapshot: string | null;
  unitSnapshot: string;
  consumptionPerUnit: number;
  unitCost: number | null;
  orderIndex: number;
};

export type CreateBomLineInput = {
  materialId: string;
  consumptionPerUnit: number;
  unitCost?: number;
  orderIndex: number;
};
