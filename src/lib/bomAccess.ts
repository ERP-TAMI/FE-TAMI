import type { AuthUser } from "@/store/authStore";

const BOM_CREATE_ROLES = new Set(["nvkh", "tpkh", "sa", "admin"]);

const BOM_COST_ROLES = new Set([
  "tpkh",
  "kt",
  "accounting",
  "ke_toan",
  "sa",
  "giam_doc",
  "director",
  "admin",
]);

export function canCreateBom(user: AuthUser | { roleCode?: string } | null): boolean {
  if (!user?.roleCode) return false;
  return BOM_CREATE_ROLES.has(user.roleCode.toLowerCase().trim());
}

export function canViewBomCost(user: AuthUser | { roleCode?: string } | null): boolean {
  if (!user?.roleCode) return false;
  return BOM_COST_ROLES.has(user.roleCode.toLowerCase().trim());
}

export function canEditDeadline(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status === "closed" || status === "discontinued" || status === "wait_sa_approve") return false;
  const role = user.roleCode.toLowerCase().trim();
  return role === "nvkh" || role === "tpkh" || role === "sa" || role === "admin";
}

export function canEditRdNote(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status === "closed" || status === "discontinued" || status === "wait_sa_approve") return false;
  const role = user.roleCode.toLowerCase().trim();
  return role === "rd" || role === "tpkh" || role === "sa" || role === "admin";
}

export function canEditHeader(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  return canEditDeadline(user, status, isHistorical) || canEditRdNote(user, status, isHistorical);
}

export function canEditTechnicalLines(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status === "closed" || status === "discontinued" || status === "wait_sa_approve" || status === "wait_accounting") return false;
  const role = user.roleCode.toLowerCase().trim();
  if (status === "wait_nvkh") return role === "nvkh";
  if (status === "wait_rd") return role === "rd";
  if (status === "wait_tpkh_confirm") return role === "tpkh";
  return false;
}

export function canEditUnitCost(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status !== "wait_accounting") return false;
  const role = user.roleCode.toLowerCase().trim();
  return role === "kt" || role === "accounting" || role === "ke_toan";
}

export function canAddBomLine(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  return canEditTechnicalLines(user, status, isHistorical);
}

export function canDeleteBomLine(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  return canEditTechnicalLines(user, status, isHistorical);
}

export function canReorderBomLines(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  return canEditTechnicalLines(user, status, isHistorical);
}

export function canEditBomLines(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status === "closed" || status === "discontinued") return false;
  return canEditTechnicalLines(user, status, isHistorical) || canEditUnitCost(user, status, isHistorical);
}

export function canForwardBom(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status === "closed" || status === "discontinued" || status === "wait_sa_approve") return false;
  const role = user.roleCode.toLowerCase().trim();

  switch (status) {
    case "wait_nvkh":
      return role === "nvkh";
    case "wait_rd":
      return role === "rd";
    case "wait_tpkh_confirm":
      return role === "tpkh";
    case "wait_accounting":
      return role === "kt" || role === "accounting" || role === "ke_toan";
    default:
      return false;
  }
}

export function canRejectBom(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status === "wait_nvkh" || status === "closed" || status === "discontinued") return false;
  const role = user.roleCode.toLowerCase().trim();

  switch (status) {
    case "wait_rd":
      return role === "rd";
    case "wait_tpkh_confirm":
      return role === "tpkh";
    case "wait_accounting":
      return role === "kt" || role === "accounting" || role === "ke_toan";
    case "wait_sa_approve":
      return role === "sa" || role === "admin";
    default:
      return false;
  }
}

export function canApproveBom(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  const role = user.roleCode.toLowerCase().trim();
  return (role === "sa" || role === "admin") && status === "wait_sa_approve";
}

export function canDiscontinueBom(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status === "discontinued") return false;
  const role = user.roleCode.toLowerCase().trim();
  return role === "sa" || role === "admin" || role === "tpkh";
}

export function canCreateRevision(
  user: AuthUser | { roleCode?: string } | null,
  status: string,
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (status !== "closed") return false;
  const role = user.roleCode.toLowerCase().trim();
  return role === "sa" || role === "admin" || role === "tpkh" || role === "nvkh";
}

export function canCopyFitBom(
  user: AuthUser | { roleCode?: string } | null,
  bom: { type: string; status: string; lines?: unknown[]; discontinuedAt?: string | Date | null },
  isHistorical = false
): boolean {
  if (!user?.roleCode || isHistorical) return false;
  if (bom.type !== "po") return false;
  if (bom.status !== "wait_nvkh") return false;
  if (bom.discontinuedAt) return false;
  if ((bom.lines?.length ?? 0) > 0) return false;
  const role = user.roleCode.toLowerCase().trim();
  return role === "nvkh" || role === "tpkh" || role === "sa" || role === "admin";
}

export function getAvailableRejectTargets(status: string): { value: import("@/types/bom").BomStatus; label: string }[] {
  switch (status) {
    case "wait_rd":
      return [{ value: "wait_nvkh", label: "N1 - Trả về NVKH" }];
    case "wait_tpkh_confirm":
      return [
        { value: "wait_rd", label: "N2 - Trả về R&D chỉnh định mức" },
        { value: "wait_nvkh", label: "N1 - Trả về NVKH" },
      ];
    case "wait_accounting":
      return [{ value: "wait_tpkh_confirm", label: "N3 - Trả về TPKH" }];
    case "wait_sa_approve":
      return [
        { value: "wait_accounting", label: "N4 - Trả về Kế toán" },
        { value: "wait_tpkh_confirm", label: "N3 - Trả về TPKH" },
        { value: "wait_rd", label: "N2 - Trả về R&D" },
        { value: "wait_nvkh", label: "N1 - Trả về NVKH" },
      ];
    default:
      return [];
  }
}

export function getForwardActionInfo(status: string): {
  buttonLabel: string;
  prompt: string;
  targetDescription: string;
} {
  switch (status) {
    case "wait_nvkh":
      return {
        buttonLabel: "Chuyển RD",
        prompt: "Nộp BOM cho RD?",
        targetDescription: "N2 - Chuyển sang bộ phận R&D định mức tiêu hao",
      };
    case "wait_rd":
      return {
        buttonLabel: "Chuyển TPKH",
        prompt: "Nộp BOM cho TPKH?",
        targetDescription: "N3 - Chuyển sang Trưởng phòng Kế hoạch (TPKH) xác nhận",
      };
    case "wait_tpkh_confirm":
      return {
        buttonLabel: "Chuyển Kế toán",
        prompt: "Chuyển BOM sang Kế toán?",
        targetDescription: "N4 - Chuyển sang bộ phận Kế toán nhập đơn giá",
      };
    case "wait_accounting":
      return {
        buttonLabel: "Chuyển SA",
        prompt: "Nộp BOM cho SA?",
        targetDescription: "N5 - Chuyển sang Ban Giám Đốc (SA) phê duyệt",
      };
    default:
      return {
        buttonLabel: "Chuyển bước",
        prompt: "Xác nhận chuyển bước tiếp theo?",
        targetDescription: "Bước tiếp theo",
      };
  }
}


export function formatUSD(value: number | null | undefined, decimals = 4): string {
  if (value == null || isNaN(Number(value))) return "—";
  const num = Number(value);
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatYield(value: number | string | null | undefined): string {
  if (value == null || value === "" || isNaN(Number(value))) return "-";
  const num = Number(value);
  if (num <= 0) return "-";
  const str = String(value);
  if (str.includes(".") && str.split(".")[1].length > 2) {
    return num.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  }
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatVND(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString("vi-VN");
}

export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export const BOM_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "wait_nvkh", label: "Nháp" },
  { value: "wait_rd", label: "Chờ R&D" },
  { value: "wait_accounting", label: "Chờ nhập giá" },
  { value: "wait_tpkh_confirm", label: "Chờ TP duyệt" },
  { value: "wait_sa_approve", label: "Chờ GĐ duyệt" },
  { value: "closed", label: "Đã duyệt" },
  { value: "discontinued", label: "Đã khóa" },
];

export const BOM_STATUS_CONFIG: Record<
  string,
  { label: string; shortLabel: string; classes: string; dotClass: string }
> = {
  wait_nvkh: {
    label: "Nháp",
    shortLabel: "Nháp",
    classes:
      "border-gray-200/60 bg-gray-50/60 text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400",
    dotClass: "bg-gray-400",
  },
  Draft: {
    label: "Nháp",
    shortLabel: "Nháp",
    classes:
      "border-gray-200/60 bg-gray-50/60 text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400",
    dotClass: "bg-gray-400",
  },
  wait_rd: {
    label: "Chờ R&D",
    shortLabel: "R&D",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  Wait_RD: {
    label: "Chờ R&D",
    shortLabel: "R&D",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  wait_tpkh_confirm: {
    label: "Chờ TP duyệt",
    shortLabel: "TP duyệt",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  Wait_TP_Approve: {
    label: "Chờ TP duyệt",
    shortLabel: "TP duyệt",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  wait_accounting: {
    label: "Chờ nhập giá",
    shortLabel: "Nhập giá",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  Wait_Price: {
    label: "Chờ nhập giá",
    shortLabel: "Nhập giá",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  wait_sa_approve: {
    label: "Chờ GĐ duyệt",
    shortLabel: "GĐ duyệt",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  Wait_SA_Approve: {
    label: "Chờ GĐ duyệt",
    shortLabel: "GĐ duyệt",
    classes:
      "border-amber-200/40 bg-amber-50/40 text-amber-700/80 dark:border-amber-900/20 dark:bg-amber-950/15 dark:text-amber-300/80",
    dotClass: "bg-amber-400/80",
  },
  closed: {
    label: "Đã duyệt",
    shortLabel: "Đã duyệt",
    classes:
      "border-brand-200/70 bg-brand-50/70 text-brand-700 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-300",
    dotClass: "bg-brand-500",
  },
  Approved: {
    label: "Đã duyệt",
    shortLabel: "Đã duyệt",
    classes:
      "border-brand-200/70 bg-brand-50/70 text-brand-700 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-300",
    dotClass: "bg-brand-500",
  },
  discontinued: {
    label: "Đã khóa",
    shortLabel: "Đã khóa",
    classes:
      "border-gray-200/60 bg-gray-50/60 text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400",
    dotClass: "bg-gray-400",
  },
  Locked: {
    label: "Đã khóa",
    shortLabel: "Đã khóa",
    classes:
      "border-gray-200/60 bg-gray-50/60 text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400",
    dotClass: "bg-gray-400",
  },
};
