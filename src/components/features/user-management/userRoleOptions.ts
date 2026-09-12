import type { UserRoleCode } from "@/types/user-management";

export const USER_ROLE_OPTIONS: Array<{
  value: UserRoleCode;
  label: string;
}> = [
  { value: "SA", label: "SA / Giám đốc" },
  { value: "IT", label: "IT" },
  { value: "TPKH", label: "Trưởng phòng Kế hoạch" },
  { value: "NVKH", label: "Nhân viên Kế hoạch" },
  { value: "RD", label: "R&D" },
  { value: "ACCOUNTING", label: "Kế toán" },
];
