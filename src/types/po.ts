import type { SampleStatus } from "./style-sample-round";

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

export interface PurchaseOrderListItem {
  id: string;
  poCode: string;
  customerPoCode: string | null;
  customerId?: string | null;
  customerNameSnapshot: string;
  receivedDate: string;
  deadline?: string | null;
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

export interface ImportFitOptions {
  copySteps?: boolean;
  copySamples?: boolean;
  copyProductionDoc?: boolean;
  copyDocuments?: boolean;
  selectedStepIds?: string[];
  selectedSampleRoundIds?: string[];
  selectedDocumentIds?: string[];
}

export interface ImportFitPreviewStep {
  id: string;
  stepName: string;
  description?: string;
  timePerPiece?: number;
  ssv?: number;
  targetTotal?: number;
  note?: string;
  orderIndex?: number;
  isGroup?: boolean;
}

export interface ImportFitPreviewSampleRound {
  id: string;
  roundNo: number;
  sampleDate?: string;
  feedback?: string;
  status?: string;
  imageCount: number;
}

export interface ImportFitPreviewDoc {
  documentId: string;
  purpose?: string;
  title: string;
  documentCode?: string | null;
}

export interface ImportFitPreviewResponse {
  style: {
    id: string;
    styleCode: string;
    styleName: string;
    category?: string;
    as3bCmBaseDays?: number;
    baseImageVersionId?: string;
  };
  operationSteps: ImportFitPreviewStep[];
  sampleRounds: ImportFitPreviewSampleRound[];
  productionDocument: {
    id: string;
    name: string;
    status: string;
    sectionCount: number;
    sizeRowCount: number;
    hasDescription: boolean;
    hasAccessories: boolean;
  } | null;
  documents: ImportFitPreviewDoc[];
}

export interface ProductColorSizeItem {
  id?: string;
  sizeLabel: string;
  quantity: number;
  orderIndex?: number;
}

export interface ProductColorItem {
  id?: string;
  colorName: string;
  orderIndex?: number;
  sizes: ProductColorSizeItem[];
  totalQuantity?: number;
}

export interface PurchaseOrderProductItem {
  id: string;
  purchaseOrderId?: string;
  sourceStyleId?: string | null;
  styleId?: string | null;
  productCode: string;
  styleCode?: string;
  productName: string;
  category?: string | null;
  materialNote?: string | null;
  colorName?: string | null;
  deadline?: string | null;
  structureImageVersionId?: string | null;
  /** URL đã ký sẵn để hiển thị ảnh kết cấu; BE resolve từ object key S3. */
  structureImageUrl?: string | null;
  status?: string | null;
  as3bCmBaseDays?: number | null;
  importedAt?: string | null;
  importedBy?: string | null;
  totalQuantity?: number;
  colors?: ProductColorItem[];
  sourceStyle?: {
    id: string;
    styleCode: string;
    styleName: string;
    category?: string;
  } | null;
  stepsCount?: number;
  samplesCount?: number;
  documentsCount?: number;
  documents?: Array<{
    documentId: string;
    purpose?: string;
    linkedAt?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export type PurchaseOrderLineItem = PurchaseOrderProductItem;

export interface CreatePoProductInput {
  productCode: string;
  productName: string;
  sourceStyleId?: string;
  category?: string;
  materialNote?: string;
  deadline: string;
  as3bCmBaseDays?: number;
  importOptions?: ImportFitOptions;
  poDocumentIds?: string[];
  colors?: Array<{
    id?: string;
    colorName: string;
    sizes: Array<{ sizeLabel: string; quantity: number }>;
  }>;
}

export interface UpdatePoProductInput {
  productCode?: string;
  productName?: string;
  sourceStyleId?: string;
  category?: string;
  materialNote?: string;
  deadline?: string;
  as3bCmBaseDays?: number;
  reason?: string;
  structureImageVersionId?: string | null;
  colors?: Array<{
    id?: string;
    colorName: string;
    sizes: Array<{ sizeLabel: string; quantity: number }>;
  }>;
}

export interface ProductOperationStep {
  id: string;
  productId: string;
  parentStepId?: string | null;
  stageId?: string | null;
  groupId?: string | null;
  stepName: string;
  description?: string;
  timePerPiece?: number;
  ssv?: number;
  targetTotal?: number;
  note?: string;
  orderIndex: number;
  isGroup?: boolean;
}

export interface SaveProductOperationStepsInput {
  steps: Array<{
    id?: string;
    parentStepId?: string | null;
    stageId?: string | null;
    stepName: string;
    description?: string;
    timePerPiece?: number;
    ssv?: number;
    targetTotal?: number;
    note?: string;
    orderIndex?: number;
    isGroup?: boolean;
  }>;
  cmBaseDays?: number;
  reason?: string;
}

export interface ProductSampleImage {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  orderIndex: number;
  colorName: string | null;
  uploadedAt: string;
}

export interface ProductSampleRound {
  id: string;
  productId?: string;
  roundNo: number;
  sampleDate: string | null;
  feedback: string | null;
  status: SampleStatus;
  createdBy?: string | null;
  createdAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  images: ProductSampleImage[];
}

export interface CreateProductSampleRoundInput {
  sampleDate?: string;
  feedback?: string;
  status?: SampleStatus;
  images?: Array<{
    imageUrl?: string;
    documentVersionId?: string;
    colorName?: string;
  }>;
}

export interface UpdateProductSampleRoundInput {
  sampleDate?: string;
  feedback?: string;
  status?: SampleStatus;
}

export interface PresignProductSampleImageResponse {
  objectKey: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface ProductProductionDoc {
  id: string;
  productId: string;
  name: string;
  description?: string;
  status: string;
  sourceDocumentId?: string;
  copiedFromStyleId?: string;
  copiedAt?: string;
  section1Description?: string;
  section1ImageUrl?: string;
  section2Accessories?: string;
  section3Notes?: string;
  section4CustomerFeedback?: string;
  sizeData?: unknown;
  sections?: Array<{
    id: string;
    sectionCode: string;
    title: string;
    content?: string;
    imageGroups?: unknown;
    orderIndex: number;
    isFixed: boolean;
  }>;
  sizeRows?: Array<{
    id: string;
    sizeLabel: string;
    measurementName: string;
    measurementValue: number;
    tolerance?: number;
    orderIndex: number;
  }>;
}

export interface PurchaseOrderDocumentVersionItem {
  id: string;
  versionNo: number;
  originalFileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType?: string;
  changeReason?: string | null;
  uploadedAt: string;
  uploadedBy?: string | null;
}

export interface ProductDocumentItem {
  id?: string;
  productId: string;
  documentId: string;
  sourcePoDocument: boolean;
  purpose?: string;
  title: string;
  documentCode?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  currentVersionNo?: number;
  changeReason?: string | null;
  versions?: PurchaseOrderDocumentVersionItem[];
  linkedAt: string;
}

/**
 * Thông tin chung của sản phẩm PO (tab Thông tin).
 *
 * BE cố ý không trả kèm màu/size, quy trình công đoạn, đợt may mẫu, tài liệu
 * SX, tài liệu đính kèm nữa — mỗi tab gọi endpoint riêng (useProductColors,
 * useProductOperationSteps, useProductSampleRounds, useProductProductionDoc,
 * useProductDocuments).
 */
export type PurchaseOrderProductDetail = PurchaseOrderProductItem;

export interface ProductColorsResponse {
  colors: ProductColorItem[];
  totalQuantity: number;
}

/**
 * Thông tin chung của PO.
 *
 * BE cố ý không trả kèm products / documents nữa — mỗi tab gọi
 * endpoint riêng. Hai trường *Count dùng để hiện số trên nhãn tab mà không phải
 * tải cả danh sách.
 */
export interface PurchaseOrderDetail extends PurchaseOrderListItem {
  productsCount: number;
  documentsCount: number;
}

/** Tham số phân trang cho danh sách sản phẩm của PO. */
export interface PoProductQuery {
  page?: number;
  limit?: number;
}

/** Tham số phân trang cho danh sách tài liệu của PO. */
export interface PoDocumentQuery {
  page?: number;
  limit?: number;
  purpose?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePoInput {
  poCode: string;
  customerPoCode?: string;
  customerId?: string;
  customerNameSnapshot: string;
  receivedDate: string;
  deadline: string;
  note?: string;
}

export interface UpdatePoInput {
  customerPoCode?: string;
  customerId?: string;
  customerNameSnapshot?: string;
  receivedDate?: string;
  deadline?: string | null;
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
  /** Đếm theo trạng thái trên toàn bộ kết quả tìm kiếm (không chỉ trang hiện tại). */
  statusCounts?: Record<string, number>;
}
