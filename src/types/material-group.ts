export type MaterialGroupStatus = "active" | "inactive";

export type MaterialGroup = {
  id: string;
  name: string;
  status: MaterialGroupStatus;
};

export type MaterialGroupInput = Pick<MaterialGroup, "name">;

export type MaterialGroupQuery = {
  search?: string;
  status?: MaterialGroupStatus;
  page?: number;
  limit?: number;
};

export type MaterialGroupListResponse = {
  data: MaterialGroup[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
