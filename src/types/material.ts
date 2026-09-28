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
  page?: number;
  limit?: number;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MaterialListResponse = {
  data: Material[];
  meta: PaginationMeta;
};

export type MaterialInput = {
  materialCode: string;
  materialName: string;
  materialGroupId?: string | null;
  defaultUnitId: string;
  defaultYieldPct?: string;
};

export type MaterialUpdateInput = Partial<MaterialInput>;

export type Unit = {
  id: string;
  name: string;
  status: MaterialStatus;
};

export type UnitQuery = {
  search?: string;
  status?: MaterialStatus;
  page?: number;
  limit?: number;
};

export type UnitListResponse = {
  data: Unit[];
  meta: PaginationMeta;
};
