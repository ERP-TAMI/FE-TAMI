/** Nguyên phụ liệu (NPL) — Material BOM types */

/** Phân biệt đối tượng: Mẫu Fit hay Sản phẩm PO */
export type NplObjectType = "fit" | "po";

/** Trạng thái BOM theo workflow duyệt */
export type NplStatus =
  | "Draft"
  | "Wait_RD"
  | "Wait_Price"
  | "Wait_TP_Approve"
  | "Wait_SA_Approve"
  | "Approved"
  | "Locked";

/** Một dòng trong danh sách NPL */
export interface NplListItem {
  id: string;
  /** Mẫu Fit hoặc Sản phẩm PO */
  objectType: NplObjectType;
  /** Mã PO hoặc Mã Fit tương ứng */
  objectCode: string;
  /** Mã style gốc */
  styleCode: string;
  /** Tên sản phẩm / tên mẫu */
  productName: string;
  /** Tên màu */
  colorName: string | null;
  /** Trạng thái workflow */
  status: NplStatus;
  /** Phiên bản */
  version: number;
  /** Giá thành trên mỗi sản phẩm (đã tổng hợp từ BOM lines). Null nếu chưa có giá hoặc không có quyền xem */
  totalCostPerUnit: number | null;
  /** Ngày tạo ISO string */
  createdAt: string;
  /** Raw PO id — dùng cho navigation */
  poId: string;
  /** Ảnh sản phẩm (nếu có) */
  imageUrl?: string | null;
}

/** Metadata phân trang chuẩn từ BE */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Envelope phân trang trả về từ API NPL */
export interface PaginatedNplResponse {
  data: NplListItem[];
  meta: PaginationMeta;
}

/** Filter params cho hook useNplList */
export interface NplQueryFilter {
  objectType?: NplObjectType;
  status?: NplStatus;
  poCode?: string;
  search?: string;
  colorName?: string;
  page?: number;
  limit?: number;
}

/** Raw BOM entity trả về từ BE `GET /boms` */
export interface RawBomItem {
  id: string;
  objectType?: NplObjectType;
  objectCode?: string;
  poId?: string;
  lineId?: string;
  colorId?: string | null;
  colorName?: string | null;
  styleCode: string;
  productName: string;
  poQuantity?: number;
  version: number;
  status: NplStatus;
  changeReason?: string | null;
  rejectReason?: string | null;
  rdComment?: string | null;
  totalCostPerUnit: number | string | null;
  deadline?: string | null;
  createdAt: string;
  bomLines?: unknown[];
}
