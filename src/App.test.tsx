import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { AppRoutes } from "@/App";
import { ThemeProvider } from "@/context/ThemeContext";
import { materialGroupApi } from "@/api/material-group.api";
import { stageApi } from "@/api/stage.api";
import { stageGroupApi } from "@/api/stage-group.api";
import { workshopApi } from "@/api/workshop.api";
import { sizeChartApi } from "@/api/size-chart.api";
import { useAuthStore } from "@/store/authStore";

const NativeRequest = globalThis.Request;

class RouterTestRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    const { signal: _signal, ...compatibleInit } = init ?? {};
    super(input, compatibleInit);
  }
}

vi.mock("@/api/material-group.api", () => ({
  materialGroupApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/api/stage.api", () => ({
  stageApi: {
    list: vi.fn().mockResolvedValue([]),
    detail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    updateSsvBulk: vi.fn(),
  },
}));

vi.mock("@/api/stage-group.api", () => ({
  stageGroupApi: {
    list: vi.fn().mockResolvedValue([]),
    detail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock("@/api/workshop.api", () => ({
  workshopApi: {
    list: vi.fn().mockResolvedValue([]),
    detail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock("@/api/size-chart.api", () => ({
  sizeChartApi: {
    list: vi.fn().mockResolvedValue([]),
    detail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock("@/pages/po/PoDetailPage", () => ({
  default: ({ readOnlyManagement = false }: { readOnlyManagement?: boolean }) => (
    <div>{readOnlyManagement ? "Shared PO detail in Management read-only mode" : "PO detail"}</div>
  ),
}));

vi.mock("@/pages/po/PoProductDetailPage", () => ({
  default: ({
    readOnlyManagement = false,
    managementContext = false,
  }: {
    readOnlyManagement?: boolean;
    managementContext?: boolean;
  }) => (
    <div>
      Shared PO product detail · readOnly={String(readOnlyManagement)} · management={String(managementContext)}
    </div>
  ),
}));

// Route-wiring tests don't exercise the real bootstrap/refresh flow (that's
// covered by apiClient.test.ts) — they just need `status` to reflect
// whatever the test puts in the auth store, synchronously.
vi.mock("@/hooks/useAuthBootstrap", async () => {
  const { useAuthStore } = await import("@/store/authStore");
  return {
    useAuthBootstrap: () => useAuthStore((state) => state.status),
  };
});

vi.mock("@/hooks/useProfile", async () => {
  const { useAuthStore } = await import("@/store/authStore");
  return {
    useProfile: () => {
      const user = useAuthStore((state) => state.user);
      return {
        profile: {
          data: user,
          isPending: false,
          isError: false,
          refetch: vi.fn(),
        },
        updateProfile: { isPending: false, mutateAsync: vi.fn() },
        changePassword: { isPending: false, mutateAsync: vi.fn() },
      };
    },
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  window.history.pushState({}, "", "/dashboard");
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  const emptyMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
  vi.mocked(materialGroupApi.list).mockResolvedValue({ data: [], meta: emptyMeta });
  vi.mocked(stageApi.list).mockResolvedValue({ data: [], meta: emptyMeta });
  vi.mocked(stageGroupApi.list).mockResolvedValue({ data: [], meta: emptyMeta });
  vi.mocked(workshopApi.list).mockResolvedValue({ data: [], meta: emptyMeta });
  vi.mocked(sizeChartApi.list).mockResolvedValue({ data: [], meta: emptyMeta });
  useAuthStore.setState({ status: "unauthenticated", user: null, accessToken: null });
});

function signIn() {
  useAuthStore.setState({
    status: "authenticated",
    accessToken: "test-access-token",
    user: {
      id: "11111111-1111-1111-1111-111111111111",
      email: "sa@tami.test",
      fullName: "Quản trị hệ thống",
      phone: null,
      roleCode: "SA",
      roleName: "Quản trị hệ thống",
      permissions: [
        "management.area.access",
        "system.users.manage",
      ],
      purchaseOrderMode: "READ_ONLY",
    },
  });
}

function signInAsIt(permissions = ["system.users.manage"]) {
  useAuthStore.setState({
    status: "authenticated",
    accessToken: "it-access-token",
    user: {
      id: "22222222-2222-4222-8222-222222222222",
      email: "it@tami.test",
      fullName: "Nhân viên IT",
      phone: null,
      roleCode: "IT",
      roleName: "Công nghệ thông tin",
      permissions,
      purchaseOrderMode: "READ_ONLY",
    },
  });
}

function renderApp() {
  vi.stubGlobal("Request", RouterTestRequest);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "*", element: <AppRoutes /> }], {
    initialEntries: [window.location.pathname],
  });
  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App router={router} />
        </ThemeProvider>
      </QueryClientProvider>,
    ),
  };
}

describe("application routes", () => {
  it.each([
    ["/management/profile", "Khu Quản lý"],
    ["/it/profile", "Quản trị người dùng"],
    ["/profile", "Hệ thống"],
  ] as const)(
    "renders the account page at %s with the correct area breadcrumb",
    (path, rootLabel) => {
      if (path.startsWith("/it/")) signInAsIt();
      else signIn();
      window.history.pushState({}, "", path);
      renderApp();

      expect(screen.getByRole("heading", { name: "Tài khoản của tôi" })).toBeTruthy();
      expect(
        within(screen.getByRole("navigation", { name: "Điều hướng phân cấp" })).getByRole("link", {
          name: rootLabel,
        }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Thông tin cá nhân" })).toBeTruthy();
      fireEvent.click(screen.getByRole("tab", { name: "Bảo mật" }));
      expect(screen.getByRole("heading", { name: "Bảo mật tài khoản" })).toBeTruthy();
    },
  );

  it("does not link an IT profile to user management without permission", () => {
    signInAsIt([]);
    window.history.pushState({}, "", "/it/profile");
    renderApp();

    const breadcrumb = screen.getByRole("navigation", { name: "Điều hướng phân cấp" });
    expect(within(breadcrumb).getByText("Khu IT")).toBeTruthy();
    expect(within(breadcrumb).queryByRole("link", { name: "Quản trị người dùng" })).toBeNull();
  });

  it("renders the dashboard shell", () => {
    signIn();
    renderApp();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Primary navigation" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Vật tư" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Dữ liệu chung" }));
    expect(screen.getByRole("link", { name: "Vật tư" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Công đoạn" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Xưởng sản xuất" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Bảng Size" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Materials" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Nhóm vật tư" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Đơn vị tính" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Nhóm công đoạn" })).toBeNull();
  });

  it("hides the dead 'Quản lý PO' sidebar link for a read-only SA (route redirects there anyway)", () => {
    signIn(); // default SA, purchaseOrderMode: READ_ONLY
    renderApp();

    expect(screen.queryByRole("link", { name: "Quản lý PO" })).toBeNull();
  });

  it("shows 'Quản lý PO' again once the SA switches to full PO access", () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, purchaseOrderMode: "FULL_ACCESS" },
    });
    renderApp();

    expect(screen.getByRole("link", { name: "Quản lý PO" })).toBeTruthy();
  });

  it("shows 'Quản lý PO' for a non-management employee regardless of PO mode", () => {
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "nvkh-access-token",
      user: {
        id: "33333333-3333-4333-8333-333333333333",
        email: "nvkh@tami.test",
        fullName: "Nhân viên Kế hoạch",
        phone: null,
        roleCode: "NVKH",
        roleName: "Nhân viên Kế hoạch",
        permissions: [],
        purchaseOrderMode: "READ_ONLY",
      },
    });
    renderApp();

    expect(screen.getByRole("link", { name: "Quản lý PO" })).toBeTruthy();
  });

  it("renders the public login route", () => {
    window.history.pushState({}, "", "/login");
    renderApp();

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeTruthy();
  });

  it("renders the password setup route without authentication", async () => {
    window.history.pushState({}, "", "/set-password");
    renderApp();

    expect(await screen.findByRole("heading", { name: "Đặt mật khẩu" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Đăng nhập" })).toBeNull();
  });

  it("redirects an unauthenticated visitor from a protected route to /login", () => {
    window.history.pushState({}, "", "/masters/materials/groups");
    renderApp();

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeTruthy();
  });

  it("redirects an authenticated visitor away from /login", () => {
    signIn();
    window.history.pushState({}, "", "/login");
    renderApp();

    expect(screen.getByRole("heading", { name: "Dashboard quản lý" })).toBeTruthy();
  });

  it("lets an admin switch areas without replacing the session", async () => {
    signIn();
    const session = useAuthStore.getState().user;
    window.history.pushState({}, "", "/management/dashboard");
    const { router } = renderApp();
    expect(screen.getByRole("navigation", { name: "Điều hướng Quản lý" })).toBeTruthy();
    expect(screen.queryByRole("complementary", { name: "Primary navigation" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    fireEvent.click(screen.getByRole("link", { name: "Vào hệ thống nhân viên" }));
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    fireEvent.click(screen.getByRole("link", { name: "Về khu Quản lý" }));
    expect(await screen.findByRole("heading", { name: "Dashboard quản lý" })).toBeTruthy();
    expect(useAuthStore.getState().user).toBe(session);
    expect(useAuthStore.getState().accessToken).toBe("test-access-token");
  });

  it("denies employee deep links to management", () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, roleCode: "NVKH", permissions: [] },
    });
    window.history.pushState({}, "", "/management/purchase-orders");
    const { router } = renderApp();
    expect(router.state.location.pathname).toBe("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    expect(screen.queryByRole("link", { name: "Về khu Quản lý" })).toBeNull();
  });

  it("denies a management PO detail deep link without management access", () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, permissions: [] },
    });
    window.history.pushState({}, "", "/management/purchase-orders/11111111-1111-4111-8111-111111111111");
    const { router } = renderApp();

    expect(router.state.location.pathname).toBe("/dashboard");
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
  });

  it("routes an authorized Management PO detail through the shared read-only PO page", () => {
    signIn();
    window.history.pushState({}, "", "/management/purchase-orders/11111111-1111-4111-8111-111111111111");
    renderApp();

    expect(screen.getByText("Shared PO detail in Management read-only mode")).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Điều hướng Quản lý" })).toBeTruthy();
  });

  it("redirects a management-only account away from editable PO routes", () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, permissions: ["management.area.access"] },
    });
    window.history.pushState({}, "", "/po/11111111-1111-4111-8111-111111111111");
    const { router } = renderApp();

    expect(router.state.location.pathname).toBe("/management/dashboard");
    expect(screen.getByRole("heading", { name: "Dashboard quản lý" })).toBeTruthy();
  });

  it("redirects an SA in read-only mode away from editable PO routes", () => {
    signIn();
    window.history.pushState({}, "", "/po/11111111-1111-4111-8111-111111111111");
    const { router } = renderApp();

    expect(router.state.location.pathname).toBe("/management/dashboard");
  });

  it("lets an SA in read-only mode inspect product details inside Management", () => {
    signIn();
    window.history.pushState(
      {},
      "",
      "/management/purchase-orders/11111111-1111-4111-8111-111111111111/products/22222222-2222-4222-8222-222222222222/steps",
    );
    renderApp();

    expect(
      screen.getByText(
        "Shared PO product detail · readOnly=true · management=true",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Điều hướng Quản lý" })).toBeTruthy();
  });

  it("keeps product detail editable in Management when the SA has full PO access", () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, purchaseOrderMode: "FULL_ACCESS" },
    });
    window.history.pushState(
      {},
      "",
      "/management/purchase-orders/11111111-1111-4111-8111-111111111111/products/22222222-2222-4222-8222-222222222222",
    );
    renderApp();

    expect(
      screen.getByText(
        "Shared PO product detail · readOnly=false · management=true",
      ),
    ).toBeTruthy();
  });

  it("keeps regular PO routes available to an SA in full-access mode", () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, purchaseOrderMode: "FULL_ACCESS" },
    });
    window.history.pushState({}, "", "/po/11111111-1111-4111-8111-111111111111");
    renderApp();

    expect(screen.getByText("PO detail")).toBeTruthy();
  });

  it("opens Management PO detail with editing enabled only in full-access mode", () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, purchaseOrderMode: "FULL_ACCESS" },
    });
    window.history.pushState({}, "", "/management/purchase-orders/11111111-1111-4111-8111-111111111111");
    renderApp();

    expect(screen.getByText("PO detail")).toBeTruthy();
  });

  it("redirects non-SA management accounts away from editable PO routes", () => {
    signIn();
    useAuthStore.setState({
      user: {
        ...useAuthStore.getState().user!,
        roleCode: "TPKH",
        permissions: ["management.area.access"],
      },
    });
    window.history.pushState({}, "", "/po/11111111-1111-4111-8111-111111111111");
    const { router } = renderApp();

    expect(router.state.location.pathname).toBe("/management/dashboard");
  });

  it("does not grant management access from the legacy director role name", () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, roleCode: "DIRECTOR", permissions: [] },
    });
    window.history.pushState({}, "", "/management/dashboard");
    const { router } = renderApp();

    expect(router.state.location.pathname).toBe("/dashboard");
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
    expect(screen.queryByRole("link", { name: "Về khu Quản lý" })).toBeNull();
  });

  it("waits for session bootstrap before showing management", () => {
    useAuthStore.setState({ status: "loading" });
    window.history.pushState({}, "", "/management/dashboard");
    renderApp();
    expect(screen.getByRole("status", { name: "Đang tải" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Dashboard quản lý" })).toBeNull();
  });

  it("redirects the masters entry route to materials", () => {
    signIn();
    window.history.pushState({}, "", "/masters");
    renderApp();

    expect(screen.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeTruthy();
  });

  it("renders the material groups management route", () => {
    signIn();
    window.history.pushState({}, "", "/masters/materials/groups");
    renderApp();

    expect(screen.getByRole("heading", { name: "Nhóm vật tư" })).toBeTruthy();
  });

  it("renders the units management route", () => {
    signIn();
    window.history.pushState({}, "", "/masters/materials/units");
    renderApp();

    expect(screen.getByRole("heading", { name: "Đơn vị tính" })).toBeTruthy();
  });

  it("switches between materials tabs without leaving the hub page", async () => {
    signIn();
    window.history.pushState({}, "", "/masters/materials");
    const { router } = renderApp();

    expect(screen.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Nhóm vật tư" }));
    expect(router.state.location.pathname).toBe("/masters/materials/groups");
    expect(await screen.findByRole("heading", { name: "Nhóm vật tư" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Đơn vị tính" }));
    expect(router.state.location.pathname).toBe("/masters/materials/units");
    expect(await screen.findByRole("heading", { name: "Đơn vị tính" })).toBeTruthy();
  });

  it("renders the stages management route", () => {
    signIn();
    window.history.pushState({}, "", "/masters/stages");
    renderApp();

    expect(screen.getByRole("heading", { name: "Công đoạn" })).toBeTruthy();
  });

  it("renders the stage groups management route", () => {
    signIn();
    window.history.pushState({}, "", "/masters/stages/groups");
    renderApp();

    expect(screen.getByRole("heading", { name: "Nhóm công đoạn" })).toBeTruthy();
  });

  it("switches between stage tabs without leaving the hub page", async () => {
    signIn();
    window.history.pushState({}, "", "/masters/stages");
    const { router } = renderApp();

    expect(screen.getByRole("heading", { name: "Công đoạn" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Nhóm công đoạn" }));
    expect(router.state.location.pathname).toBe("/masters/stages/groups");
    expect(await screen.findByRole("heading", { name: "Nhóm công đoạn" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Công đoạn" }));
    expect(router.state.location.pathname).toBe("/masters/stages");
    expect(await screen.findByRole("heading", { name: "Công đoạn" })).toBeTruthy();
  });

  it("renders the workshops management route", () => {
    signIn();
    window.history.pushState({}, "", "/masters/workshops");
    renderApp();

    expect(screen.getByRole("heading", { name: "Xưởng sản xuất" })).toBeTruthy();
  });

  it("renders the size charts management route", () => {
    signIn();
    window.history.pushState({}, "", "/masters/size-charts");
    renderApp();

    expect(screen.getByRole("heading", { name: "Bảng Size" })).toBeTruthy();
  });

  it("blocks sidebar navigation while the stage group form is dirty", async () => {
    signIn();
    window.history.pushState({}, "", "/masters/stages/groups");
    const { router } = renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm công đoạn" }));
    fireEvent.change(screen.getByLabelText("Tên nhóm công đoạn"), {
      target: { value: "Nhóm đang nhập" },
    });
    await act(() => router.navigate("/dashboard"));

    expect(router.state.location.pathname).toBe("/masters/stages/groups");
    expect(await screen.findByRole("heading", { name: "Hủy các thay đổi?" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }));
    expect(screen.getByDisplayValue("Nhóm đang nhập")).toBeTruthy();

    await act(() => router.navigate("/dashboard"));
    fireEvent.click(await screen.findByRole("button", { name: "Bỏ thay đổi" }));
    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeTruthy();
  });

  it("redirects the legacy IT dashboard straight to user management", async () => {
    signInAsIt();
    window.history.pushState({}, "", "/it/dashboard");
    const { router } = renderApp();

    expect(await screen.findByRole("heading", { name: "Quản trị người dùng" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/it/users");
    expect(screen.queryByRole("heading", { name: "Khu IT" })).toBeNull();
    expect(screen.queryByText("Mở Quản trị người dùng")).toBeNull();
    expect(screen.getByRole("navigation", { name: "Chức năng IT" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Quản trị người dùng" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(screen.getByRole("complementary", { name: "Điều hướng IT" })).toBeTruthy();
  });

  it("collapses the IT sidebar without hiding the accessible user-management link", async () => {
    signInAsIt();
    window.history.pushState({}, "", "/it/users");
    renderApp();

    fireEvent.click(screen.getByRole("button", { name: "Bật/tắt điều hướng IT" }));
    expect(screen.getByRole("complementary", { name: "Điều hướng IT" }).className).toContain(
      "w-[80px]",
    );
    expect(screen.getByRole("link", { name: "Quản trị người dùng" })).toBeTruthy();
  });

  it("shows user management in the management area for SA", async () => {
    signIn();
    window.history.pushState({}, "", "/management/dashboard");
    const { router } = renderApp();

    fireEvent.click(screen.getByRole("link", { name: "Quản trị người dùng" }));

    expect(await screen.findByRole("heading", { name: "Quản trị người dùng" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/management/users");
    expect(screen.getByRole("navigation", { name: "Điều hướng Quản lý" })).toBeTruthy();
  });

  it("blocks user management when the account lacks its permission", () => {
    signInAsIt([]);
    window.history.pushState({}, "", "/it/users");
    renderApp();

    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Quản trị người dùng" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Quản trị người dùng" })).toBeNull();
  });

  it("blocks employee access through new and legacy user routes", async () => {
    signIn();
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user!, roleCode: "NVKH", permissions: [] },
    });
    window.history.pushState({}, "", "/admin/users");
    const { router } = renderApp();

    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeTruthy();
    await act(() => router.navigate("/management/users"));
    expect(router.state.location.pathname).toBe("/dashboard");
    await act(() => router.navigate("/it/users"));
    expect(router.state.location.pathname).toBe("/dashboard");
  });

  it("redirects the legacy admin route to the authorized area", () => {
    signIn();
    window.history.pushState({}, "", "/admin");
    const { router } = renderApp();

    expect(screen.getByRole("heading", { name: "Quản trị người dùng" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/management/users");
  });
});
