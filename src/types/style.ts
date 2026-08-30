export type StyleStatus = "draft" | "active";

export interface Style {
  id: string;
  styleCode: string;
  styleName: string;
  description: string | null;
  category: string | null;
  status: StyleStatus;
  baseImageVersionId: string | null;
  as3bCmBaseDays: number;
  rowVersion: number;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

export interface CreateStylePayload {
  styleCode: string;
  styleName: string;
  description?: string | null;
  category?: string | null;
  baseImageVersionId?: string | null;
  status?: StyleStatus;
}

export interface UpdateStylePayload {
  styleCode?: string;
  styleName?: string;
  description?: string | null;
  category?: string | null;
  baseImageVersionId?: string | null;
  status?: StyleStatus;
}

export interface StyleQueryFilter {
  search?: string;
  category?: string;
  status?: StyleStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
