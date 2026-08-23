export type MaterialStatus = "active" | "inactive";

export type Material = {
  id: string;
  materialCode: string;
  materialName: string;
  materialGroupId: string | null;
  materialGroupName: string | null;
  defaultUnitId: string | null;
  defaultUnitName: string | null;
  defaultYieldPct: string;
  status: MaterialStatus;
  createdAt: string;
  updatedAt: string;
};

export type MaterialFilters = {
  search?: string;
  materialGroupId?: string;
  status?: MaterialStatus;
};

export type MaterialInput = {
  materialCode: string;
  materialName: string;
  materialGroupId?: string | null;
  defaultUnitId: string;
  defaultYieldPct?: string;
};

export type MaterialUpdateInput = Omit<Partial<MaterialInput>, "materialCode">;

export type Unit = {
  id: string;
  name: string;
  status: MaterialStatus;
};
