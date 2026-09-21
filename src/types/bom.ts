export type BomType = 'fit' | 'po';

export type BomStatus =
  | 'wait_nvkh'
  | 'wait_rd'
  | 'wait_tpkh_confirm'
  | 'wait_accounting'
  | 'wait_sa_approve'
  | 'closed'
  | 'discontinued';

export interface StyleSummary {
  id: string;
  styleCode: string;
  styleName: string;
  category?: string | null;
  status?: string | null;
  baseImageKey?: string | null;
}

export interface PurchaseOrderSummary {
  id: string;
  poCode: string;
  customerPoCode?: string | null;
  customerName?: string | null;
  receivedDate?: string | Date | null;
  deadline?: string | Date | null;
  status?: string | null;
}

export interface PurchaseOrderProductSummary {
  id: string;
  purchaseOrderId: string;
  productCode: string;
  productName: string;
  category?: string | null;
  deadline?: string | Date | null;
  status?: string | null;
  colors: string[];
}

export interface BomRevisionSummary {
  id: string;
  bomId: string;
  revisionNo: number;
  status: BomStatus;
  changeReason?: string | null;
  sourceRevisionId?: string | null;
  createdBy?: string | null;
  createdAt: string | Date;
  approvedBy?: string | null;
  approvedAt?: string | Date | null;
}

export interface BomLineItem {
  id: string;
  revisionId: string;
  materialId: string | null;
  materialCodeSnapshot?: string | null;
  materialNameSnapshot: string;
  material?: { id?: string; materialCode?: string; materialName?: string } | null;
  materialGroupId: string | null;
  materialGroupSnapshot: string | null;
  unitId: string | null;
  unitSnapshot: string;
  consumption: number;
  unitCost: number | null;
  lineCost: number | null;
  note: string | null;
  orderIndex: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BomListItem {
  id: string;
  bomCode: string;
  type: BomType;
  status: string;
  discontinuedAt: string | Date | null;
  discontinuedReason?: string | null;
  style: StyleSummary | null;
  purchaseOrder: PurchaseOrderSummary | null;
  product: PurchaseOrderProductSummary | null;
  purchaseOrderProduct?: PurchaseOrderProductSummary | null;
  productCodeSnapshot?: string | null;
  productNameSnapshot?: string | null;
  currentRevision: BomRevisionSummary | null;
  revisionNo: number | null;
  costPerUnit: number | null;
  currentOrderQuantity: number | null;
  currentOrderCost: number | null;
  colorNameSnapshot: string | null;
  deadline: string | Date | null;
  rdNote: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  lineCount?: number;
}

export interface BomDetail extends BomListItem {
  lines: BomLineItem[];
  rowVersion: number;
}

export interface BomStats {
  total: number;
  draftCount: number;
  pendingCount: number;
  approvedCount: number;
  discontinuedCount: number;
  byStatus: Record<string, number>;
}

export interface QueryBomsParams {
  type?: BomType;
  status?: string;
  search?: string;
  bomCode?: string;
  style?: string;
  purchaseOrder?: string;
  product?: string;
  page?: number;
  limit?: number;
  sortBy?: 'bomCode' | 'createdAt' | 'updatedAt' | 'deadline';
  sortOrder?: 'ASC' | 'DESC';
}

export interface QueryBomStatsParams {
  month?: string;
  year?: string | number;
  startDate?: string;
  endDate?: string;
  type?: BomType;
}

export interface CreateFitBomPayload {
  type: 'fit';
  styleId: string;
  deadline?: string;
  rdNote?: string;
}

export interface CreatePoBomPayload {
  type: 'po';
  purchaseOrderProductId: string;
  deadline?: string;
  rdNote?: string;
}

export type CreateBomPayload = CreateFitBomPayload | CreatePoBomPayload;

export interface PaginatedBomsResponse {
  data: BomListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateBomPayload {
  deadline?: string;
  rdNote?: string;
}

export interface DiscontinueBomPayload {
  reason: string;
}

export interface CreateBomLinePayload {
  materialId?: string;
  consumption: number;
  unitCost?: number;
  note?: string;
  orderIndex?: number;
}

export interface UpdateBomLinePayload {
  materialId?: string;
  consumption?: number;
  unitCost?: number | null;
  note?: string;
  orderIndex?: number;
}

export interface ReorderBomLinesPayload {
  lineIds: string[];
}

export interface ForwardBomPayload {
  reason?: string;
  note?: string;
}

export interface RejectBomPayload {
  targetStatus: BomStatus;
  reason: string;
}

export interface ApproveBomPayload {
  reason?: string;
  note?: string;
}

export interface CreateRevisionPayload {
  changeReason?: string;
  reason?: string;
}

export interface CopyFitToPoPayload {
  sourceRevisionId?: string;
  targetBomId?: string;
}

export interface RevisionListItem {
  id: string;
  bomId: string;
  revisionNo: number;
  status: BomStatus;
  sourceRevisionId?: string | null;
  changeReason?: string | null;
  createdBy?: string | null;
  createdAt: string | Date;
  approvedBy?: string | null;
  approvedAt?: string | Date | null;
  isCurrent: boolean;
  lineCount?: number;
}

export interface RevisionDetail extends RevisionListItem {
  lines: BomLineItem[];
  costPerUnit: number | null;
}

export type RevisionDiffType = 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED';

export interface RevisionDiffLineSnapshot {
  consumption: number;
  unitCost: number | null;
  lineCost: number | null;
  note: string | null;
  orderIndex?: number;
}

export interface RevisionDiffItem {
  materialId: string;
  materialNameSnapshot: string;
  materialGroupSnapshot?: string | null;
  unitSnapshot: string;
  diffType: RevisionDiffType;
  oldLine?: RevisionDiffLineSnapshot | null;
  newLine?: RevisionDiffLineSnapshot | null;
  source?: RevisionDiffLineSnapshot | null;
  target?: RevisionDiffLineSnapshot | null;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export interface RevisionDiffResponse {
  bomId?: string;
  targetRevisionId?: string;
  targetRevisionNo?: number;
  baseRevisionId?: string;
  baseRevisionNo?: number;
  oldCostPerUnit?: number | null;
  newCostPerUnit?: number | null;
  costDifference?: number | null;
  totalAdded?: number;
  totalRemoved?: number;
  totalChanged?: number;
  totalUnchanged?: number;
  currentRevision?: {
    id: string;
    revisionNo: number;
    status: BomStatus;
  };
  comparedRevision?: {
    id: string;
    revisionNo: number;
    status: BomStatus;
  };
  items: RevisionDiffItem[];
}

export interface BomWorkflowHistoryItem {
  id: string;
  revisionId: string;
  oldStatus?: BomStatus | null;
  newStatus?: BomStatus;
  fromStatus?: BomStatus;
  toStatus?: BomStatus;
  action?: string;
  reason?: string | null;
  note?: string | null;
  changedBy?: string | null;
  changedAt?: string | Date;
  createdAt?: string | Date;
}

export type AggregateBreakdownType = "none" | "color" | "size" | "color_size";

export interface BomAggregateBreakdownItem {
  productId?: string;
  productName?: string;
  productCode?: string;
  colorName?: string;
  sizeLabel?: string;
  requiredQuantity: number;
}

export interface BomAggregateItem {
  materialId: string;
  materialCodeSnapshot?: string | null;
  materialCode?: string | null;
  materialNameSnapshot: string;
  materialGroupSnapshot?: string | null;
  unitSnapshot: string;
  totalRequiredQuantity: number;
  bomCount: number;
  poProductCount?: number;
  unitCost?: number | null;
  totalEstimatedCost?: number | null;
  costComplete: boolean;
  breakdown?: BomAggregateBreakdownItem[];
}

export interface BomAggregateResponse {
  data: BomAggregateItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    /** Tổng số BOM tham gia tổng hợp */
    totalBoms?: number;
    /** Tổng số sản phẩm PO tham gia tổng hợp */
    totalProducts?: number;
    /** Tổng số đơn hàng PO tham gia tổng hợp */
    totalPurchaseOrders?: number;
  };
}

export interface BomAggregateParams {
  bomId?: string;
  purchaseOrder?: string;
  purchaseOrderId?: string;
  product?: string;
  purchaseOrderProductId?: string;
  style?: string;
  styleId?: string;
  materialId?: string;
  search?: string;
  breakdown?: AggregateBreakdownType;
  page?: number;
  limit?: number;
}


