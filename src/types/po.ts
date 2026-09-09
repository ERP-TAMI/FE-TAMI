export type PoStatus =
  | "draft"
  | "pending_rd"
  | "in_progress"
  | "closed"
  | "cancelled";

export interface PurchaseOrderDocumentItem {
  documentId: string;
  documentCode: string | null;
  title: string;
  purpose: string;
  linkedAt: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export interface AttachedDocItem {
  file: File;
  purpose: string;
}

export interface PoExcelCell {
  value: string;
  image?: string;
  images?: string[];
  rowSpan?: number;
  colSpan?: number;
  isMerged?: boolean;
  bold?: boolean;
  align?: "left" | "center" | "right";
}

export interface PoDocumentPreviewSheet {
  name: string;
  rowCount: number;
  columnCount: number;
  rows: string[][];
  cells?: PoExcelCell[][];
  unanchoredImages?: string[];
}

export interface PoDocumentPreviewResponse {
  type: "excel" | "word" | "pdf" | "image" | "text" | "unsupported";
  fileName: string;
  fileUrl?: string;
  sheets?: PoDocumentPreviewSheet[];
  html?: string;
  text?: string;
}

export interface PurchaseOrderStatusHistoryItem {
  id: string;
  oldStatus: PoStatus | null;
  newStatus: PoStatus;
  action: string;
  reason: string | null;
  changedBy: string | null;
  changedAt: string;
}

export interface PurchaseOrderListItem {
  id: string;
  poCode: string;
  customerPoCode: string | null;
  customerId?: string | null;
  customerNameSnapshot: string;
  receivedDate: string;
  note: string | null;
  status: PoStatus;
  productsCount?: number;
  cancellationReason?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderProductItem {
  id: string;
  purchaseOrderId?: string;
  styleId?: string | null;
  styleCode: string;
  productName: string;
  category?: string | null;
  colorName?: string | null;
  deadline?: string | null;
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type PurchaseOrderLineItem = PurchaseOrderProductItem;

export interface CreatePoProductInput {
  styleCode: string;
  productName: string;
  category?: string;
  colorName?: string;
  deadline?: string;
  status?: string;
  styleId?: string;
}

export interface UpdatePoProductInput {
  styleCode?: string;
  productName?: string;
  category?: string;
  colorName?: string;
  deadline?: string;
  status?: string;
  styleId?: string;
}

export interface PurchaseOrderDetail extends PurchaseOrderListItem {
  documents: PurchaseOrderDocumentItem[];
  statusHistory: PurchaseOrderStatusHistoryItem[];
  products?: PurchaseOrderProductItem[];
  lines?: PurchaseOrderProductItem[];
}

export interface CreatePoInput {
  poCode: string;
  customerPoCode?: string;
  customerId?: string;
  customerNameSnapshot: string;
  receivedDate: string;
  note?: string;
}

export interface UpdatePoInput {
  customerPoCode?: string;
  customerId?: string;
  customerNameSnapshot?: string;
  receivedDate?: string;
  note?: string;
}

export interface UpdatePoStatusInput {
  status: PoStatus;
  reason?: string;
}

export interface LinkPoDocumentInput {
  documentId: string;
  purpose: string;
}

export interface PoQuery {
  search?: string;
  poCode?: string;
  customerId?: string;
  status?: PoStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedPoResponse {
  items: PurchaseOrderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
