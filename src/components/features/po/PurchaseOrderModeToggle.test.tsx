import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/api/auth.api";
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

  it("persists the SA mode change and updates the session from the API response", async () => {
    vi.spyOn(authApi, "updatePurchaseOrderMode").mockResolvedValue({
      ...saUser,
      purchaseOrderMode: "FULL_ACCESS",
    });
    renderToggle(saUser);

    const toggle = screen.getByRole("switch", { name: "Chế độ chỉnh sửa PO" });
    expect(toggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(authApi.updatePurchaseOrderMode).toHaveBeenCalledWith("FULL_ACCESS");
      expect(useAuthStore.getState().user?.purchaseOrderMode).toBe("FULL_ACCESS");
    });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("does not render for roles other than SA", () => {
    renderToggle({ ...saUser, roleCode: "NVKH", purchaseOrderMode: "READ_ONLY" });

    expect(screen.queryByRole("switch", { name: "Chế độ chỉnh sửa PO" })).toBeNull();
  });
});
