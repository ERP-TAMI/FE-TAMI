import { describe, expect, it } from "vitest";
import type { UserListResponse } from "@/types/user-management";
import { getUserListRefetchInterval } from "./useUsers";

const response: UserListResponse = {
  data: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      fullName: "Người dùng",
      email: "user@example.test",
      phone: null,
      role: { code: "NVKH", name: "Nhân viên Kế hoạch" },
      accountStatus: "locked",
      passwordSetupRequired: false,
      passwordSetupEmailStatus: null,
      passwordSetupEmailAttemptedAt: null,
      accountLockEmailStatus: "pending",
    },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

describe("getUserListRefetchInterval", () => {
  it("polls while an email delivery is pending", () => {
    expect(getUserListRefetchInterval(response)).toBe(2_000);
  });

  it.each(["sent", "failed"] as const)("stops after lock email delivery is %s", (status) => {
    expect(
      getUserListRefetchInterval({
        ...response,
        data: [{ ...response.data[0], accountLockEmailStatus: status }],
      }),
    ).toBe(false);
  });
});
