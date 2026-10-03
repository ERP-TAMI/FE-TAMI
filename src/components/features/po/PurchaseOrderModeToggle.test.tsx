import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuthStore, type AuthUser } from "@/store/authStore";
import { PurchaseOrderModeToggle } from "@/components/features/po/PurchaseOrderModeToggle";

const saUser: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "sa@tami.test",
  fullName: "Quản trị hệ thống",
  phone: null,
  roleCode: "SA",
  roleName: "Quản trị hệ thống",
  permissions: ["management.area.access"],
  purchaseOrderMode: "READ_ONLY",
};

function renderToggle(user: AuthUser) {
  useAuthStore.setState({ status: "authenticated", user, accessToken: "test-token" });
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PurchaseOrderModeToggle />
    </QueryClientProvider>,
  );
}

describe("PurchaseOrderModeToggle", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ status: "unauthenticated", user: null, accessToken: null });
  });

  it("does not render a mode switch because SA access is always full", async () => {
    renderToggle(saUser);
    expect(screen.queryByRole("switch", { name: "Chế độ chỉnh sửa PO" })).toBeNull();
    expect(useAuthStore.getState().user?.purchaseOrderMode).toBe("READ_ONLY");
  });

  it("does not render for roles other than SA", () => {
    renderToggle({ ...saUser, roleCode: "NVKH", purchaseOrderMode: "READ_ONLY" });

    expect(screen.queryByRole("switch", { name: "Chế độ chỉnh sửa PO" })).toBeNull();
  });
});
