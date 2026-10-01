import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { auditApi } from "@/api/audit.api";
import { useProfile } from "@/hooks/useProfile";
import ProfilePage from "./ProfilePage";

vi.mock("@/hooks/useProfile", () => ({ useProfile: vi.fn() }));
vi.mock("@/api/audit.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/audit.api")>();
  return {
    ...actual,
    auditApi: { ...actual.auditApi, getEntityHistory: vi.fn() },
  };
});

const mockedUseProfile = vi.mocked(useProfile);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.mocked(auditApi.getEntityHistory).mockReset();
});

describe("ProfilePage", () => {
  it("shows personal, security, and activity tabs and switches their content", async () => {
    vi.mocked(auditApi.getEntityHistory).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 8,
      totalPages: 0,
    });
    mockedUseProfile.mockReturnValue({
      profile: {
        data: {
          id: "11111111-1111-4111-8111-111111111111",
          email: "it@tami.test",
          fullName: "Công nghệ thông tin",
          phone: "0912345678",
          roleCode: "IT",
          roleName: "Công nghệ thông tin",
          permissions: ["dashboard.view"],
          purchaseOrderMode: "READ_ONLY",
        },
        isPending: false,
        isError: false,
        refetch: vi.fn(),
      },
      updateProfile: { isPending: false, mutateAsync: vi.fn() },
      changePassword: { isPending: false, mutateAsync: vi.fn() },
    } as never);

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/it/profile"]}>
          <ProfilePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const tabs = screen.getByRole("tablist", { name: "Tài khoản" });
    const personalTab = screen.getByRole("tab", { name: "Thông tin cá nhân" });
    expect(personalTab.getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(personalTab, { key: "ArrowRight" });
    const securityTab = screen.getByRole("tab", { name: "Bảo mật" });
    expect(securityTab.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(securityTab);
    fireEvent.keyDown(securityTab, { key: "ArrowLeft" });
    expect(personalTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getAllByText("it@tami.test")).toHaveLength(2);

    fireEvent.click(screen.getByRole("tab", { name: "Bảo mật" }));
    expect(screen.getByRole("button", { name: "Đổi mật khẩu" })).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Hoạt động" }));
    expect(screen.getByRole("tabpanel")).toBeTruthy();
    expect(await screen.findByText("Chưa có dữ liệu hoạt động để hiển thị."))
      .toBeTruthy();
    await waitFor(() => {
      expect(auditApi.getEntityHistory).toHaveBeenCalledWith({
        aggregateType: "User",
        aggregateId: "11111111-1111-4111-8111-111111111111",
        page: 1,
        limit: 8,
      });
    });
    expect(tabs.getAttribute("role")).toBe("tablist");
  });

  it("keeps the profile focused on personal information and password security", () => {
    mockedUseProfile.mockReturnValue({
      profile: {
        data: {
          id: "11111111-1111-4111-8111-111111111111",
          email: "it@tami.test",
          fullName: "Công nghệ thông tin",
          phone: "0912345678",
          roleCode: "IT",
          roleName: "Công nghệ thông tin",
          permissions: ["dashboard.view"],
          purchaseOrderMode: "READ_ONLY",
        },
        isPending: false,
        isError: false,
        refetch: vi.fn(),
      },
      updateProfile: { isPending: false, mutateAsync: vi.fn() },
      changePassword: { isPending: false, mutateAsync: vi.fn() },
    } as never);

    render(
      <MemoryRouter initialEntries={["/it/profile"]}>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Thông tin cá nhân" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Bảo mật tài khoản" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Bảo mật" }));
    expect(screen.getByRole("heading", { name: "Bảo mật tài khoản" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Đổi mật khẩu" })).toBeTruthy();
    expect(screen.queryByText("Thông tin tổ chức & tài khoản")).toBeNull();
    expect(screen.queryByText("Xác thực hai yếu tố (2FA)")).toBeNull();
  });
});
