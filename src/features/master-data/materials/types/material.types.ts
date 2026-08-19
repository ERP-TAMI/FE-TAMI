export type MaterialStatus = "active" | "inactive";

export type MaterialLookup = {
  id: string;
  code: string;
  name: string;
};

export type Material = {
  id: string;
  materialCode: string;
  materialName: string;
  materialGroupId: string | null;
  defaultUnitId: string;
  defaultYieldPct: number;
  lastUnitCost: number;
  currentStock: number;
  lowStockThreshold: number;
  materialGroup: MaterialLookup | null;
  defaultUnit: MaterialLookup | null;
  status: MaterialStatus;
};

export type MaterialInput = Pick<
  Material,
  | "materialCode"
  | "materialName"
  | "defaultUnitId"
  | "defaultYieldPct"
  | "lastUnitCost"
  | "currentStock"
  | "lowStockThreshold"
> & { materialGroupId?: string };

export type MaterialListFilters = {
  search?: string;
  materialGroupId?: string;
  status?: MaterialStatus;
};
