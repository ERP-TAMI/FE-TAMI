import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { managementDashboardApi } from "@/api/management-dashboard.api";
import { managementDashboardKeys } from "@/api/management-dashboard.keys";
import { poApi } from "@/api/po.api";
import { userManagementApi } from "@/api/user-management.api";
import {
  useManagementDashboardSummary,
  useManagementPurchaseOrdersOverview,
} from "./useManagementDashboard";
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  useUpdatePoStatus,
} from "./usePurchaseOrders";
import {
  useCreateUser,
  useUpdateUser,
  useUpdateUserStatus,
  useResetUserPassword,
} from "./useUsers";

const summary = {
  month: "2026-09",
  totalPurchaseOrders: 1,
  completedPurchaseOrders: 0,
  overduePurchaseOrders: 0,
  activeEmployees: 1,
};

function useMutations() {
  return {
    createPo: useCreatePurchaseOrder(),
    updatePo: useUpdatePurchaseOrder(),
    deletePo: useDeletePurchaseOrder(),
    statusPo: useUpdatePoStatus(),
    createUser: useCreateUser(),
    updateUser: useUpdateUser(),
    statusUser: useUpdateUserStatus(),
    resetPassword: useResetUserPassword(),
  };
}

const userInput = {
  fullName: "Test",
  email: "test@example.test",
  phone: null,
  roleCode: "IT" as const,
};
afterEach(() => vi.restoreAllMocks());
const cases: Array<
  [string, (mutations: ReturnType<typeof useMutations>) => Promise<unknown>, () => void]
> = [
  [
    "create PO",
    (m) =>
      m.createPo.mutateAsync({
        poCode: "PO",
        customerNameSnapshot: "Customer",
        deadline: "2026-09-30",
        customerId: "customer",
        receivedDate: "2026-09-01",
      }),
    () => {
      vi.spyOn(poApi, "create").mockResolvedValue({ id: "po" } as Awaited<
        ReturnType<typeof poApi.create>
      >);
    },
  ],
  [
    "update PO",
    (m) => m.updatePo.mutateAsync({ id: "po", input: { receivedDate: "2026-10-01" } }),
    () => {
      vi.spyOn(poApi, "update").mockResolvedValue({ id: "po" } as Awaited<
        ReturnType<typeof poApi.update>
      >);
    },
  ],
  [
    "delete PO",
    (m) => m.deletePo.mutateAsync("po"),
    () => {
      vi.spyOn(poApi, "remove").mockResolvedValue(undefined);
    },
  ],
  [
    "change PO status",
    (m) => m.statusPo.mutateAsync({ id: "po", input: { status: "closed" } }),
    () => {
      vi.spyOn(poApi, "updateStatus").mockResolvedValue({ id: "po" } as Awaited<
        ReturnType<typeof poApi.updateStatus>
      >);
    },
  ],
  [
    "create user",
    (m) => m.createUser.mutateAsync(userInput),
    () => {
      vi.spyOn(userManagementApi, "create").mockResolvedValue(
        {} as Awaited<ReturnType<typeof userManagementApi.create>>,
      );
    },
  ],
  [
    "update user",
    (m) => m.updateUser.mutateAsync({ id: "user", input: userInput }),
    () => {
      vi.spyOn(userManagementApi, "update").mockResolvedValue(
        {} as Awaited<ReturnType<typeof userManagementApi.update>>,
      );
    },
  ],
  [
    "lock user",
    (m) => m.statusUser.mutateAsync({ id: "user", input: { accountStatus: "locked" } }),
    () => {
      vi.spyOn(userManagementApi, "updateAccountStatus").mockResolvedValue(
        {} as Awaited<ReturnType<typeof userManagementApi.updateAccountStatus>>,
      );
    },
  ],
  [
    "unlock user",
    (m) => m.statusUser.mutateAsync({ id: "user", input: { accountStatus: "active" } }),
    () => {
      vi.spyOn(userManagementApi, "updateAccountStatus").mockResolvedValue(
        {} as Awaited<ReturnType<typeof userManagementApi.updateAccountStatus>>,
      );
    },
  ],
  [
    "reset password",
    (m) => m.resetPassword.mutateAsync("user"),
    () => {
      vi.spyOn(userManagementApi, "resetPassword").mockResolvedValue(
        {} as Awaited<ReturnType<typeof userManagementApi.resetPassword>>,
      );
    },
  ],
];

describe("management dashboard after mutations", () => {
  it.each(cases)(
    "refetches fresh cached summaries after %s on navigation and while mounted",
    async (_label, mutate, mockApi) => {
      mockApi();
      const updated = { ...summary, totalPurchaseOrders: 2, activeEmployees: 0 };
      const getSummary = vi.spyOn(managementDashboardApi, "getSummary").mockResolvedValue(updated);
      const client = new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false },
          mutations: { retry: false },
        },
      });
      const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      const keys = ["2026-09", "2026-10"].map(managementDashboardKeys.summary);
      keys.forEach((key) => client.setQueryData<typeof summary>(key, summary));
      const mutations = renderHook(useMutations, { wrapper });
      await act(() => mutate(mutations.result.current));
      keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
      const dashboard = renderHook(() => useManagementDashboardSummary("2026-09"), { wrapper });
      await waitFor(() => expect(dashboard.result.current.data).toEqual(updated));
      getSummary.mockResolvedValue({ ...updated, activeEmployees: 3 });
      await act(() => mutate(mutations.result.current));
      await waitFor(() => expect(dashboard.result.current.data?.activeEmployees).toBe(3));
      expect(getSummary).toHaveBeenCalledTimes(2);
      dashboard.unmount();
      mutations.unmount();
      client.clear();
      vi.restoreAllMocks();
    },
  );

  it.each(cases.slice(0, 4))(
    "invalidates purchase-order overview pages after %s",
    async (_label, mutate, mockApi) => {
      mockApi();
      const client = new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false },
          mutations: { retry: false },
        },
      });
      const wrapper = ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      const keys = [
        managementDashboardKeys.purchaseOrdersByPage("2026-09", 1, 10),
        managementDashboardKeys.purchaseOrdersByPage("2026-10", 2, 10),
      ];
      const staleOverview = {
        month: "2026-09",
        totalPurchaseOrders: 1,
        overduePurchaseOrders: 0,
        upcomingPurchaseOrders: 0,
        items: [],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      keys.forEach((key) =>
        client.setQueryData<typeof staleOverview>(key, staleOverview),
      );
      const mutations = renderHook(useMutations, { wrapper });

      await act(() => mutate(mutations.result.current));

      keys.forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
      const refreshedOverview = {
        month: "2026-09",
        totalPurchaseOrders: 2,
        overduePurchaseOrders: 0,
        upcomingPurchaseOrders: 0,
        items: [],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };
      const getOverview = vi
        .spyOn(managementDashboardApi, "getPurchaseOrdersOverview")
        .mockResolvedValue(refreshedOverview);
      const overview = renderHook(() => useManagementPurchaseOrdersOverview("2026-09", 1, 10), {
        wrapper,
      });
      await waitFor(() => expect(overview.result.current.data).toEqual(refreshedOverview));
      expect(getOverview).toHaveBeenCalledWith("2026-09", 1, 10, expect.any(AbortSignal));
      overview.unmount();
      mutations.unmount();
      client.clear();
      vi.restoreAllMocks();
    },
  );
});
