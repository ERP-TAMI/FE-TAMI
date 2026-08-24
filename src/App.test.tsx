import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { ThemeProvider } from "@/context/ThemeContext";
import { materialGroupApi } from "@/api/material-group.api";
import { stageApi } from "@/api/stage.api";
import { useAuthStore } from "@/store/authStore";

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

// Route-wiring tests don't exercise the real bootstrap/refresh flow (that's
// covered by apiClient.test.ts) — they just need `status` to reflect
// whatever the test puts in the auth store, synchronously.
vi.mock("@/hooks/useAuthBootstrap", async () => {
  const { useAuthStore } = await import("@/store/authStore");
  return {
    useAuthBootstrap: () => useAuthStore((state) => state.status),
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.history.pushState({}, "", "/dashboard");
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.mocked(materialGroupApi.list).mockResolvedValue([]);
  vi.mocked(stageApi.list).mockResolvedValue([]);
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
      roleCode: "SA",
      roleName: "Quản trị hệ thống",
      permissions: [],
    },
  });
}

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("application routes", () => {
  it("renders the dashboard shell", () => {
    signIn();
    renderApp();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Primary navigation" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Vật tư" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Dữ liệu chung" }));
    expect(screen.getByRole("link", { name: "Vật tư" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Materials" })).toBeNull();
  });

  it("renders the public login route", () => {
    window.history.pushState({}, "", "/login");
    renderApp();

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeTruthy();
  });

  it("redirects an unauthenticated visitor from a protected route to /login", () => {
    window.history.pushState({}, "", "/masters/material-groups");
    renderApp();

    expect(screen.getByRole("heading", { name: "Đăng nhập" })).toBeTruthy();
  });

  it("redirects an authenticated visitor away from /login", () => {
    signIn();
    window.history.pushState({}, "", "/login");
    renderApp();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
  });

  it("redirects the masters entry route to materials", () => {
    signIn();
    window.history.pushState({}, "", "/masters");
    renderApp();

    expect(screen.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeTruthy();
  });

  it("renders the material groups management route", () => {
    signIn();
    window.history.pushState({}, "", "/masters/material-groups");
    renderApp();

    expect(screen.getByRole("heading", { name: "Nhóm vật tư" })).toBeTruthy();
  });

  it("renders the stages management route", () => {
    signIn();
    window.history.pushState({}, "", "/masters/stages");
    renderApp();

    expect(screen.getByRole("heading", { name: "Giai đoạn công đoạn" })).toBeTruthy();
  });

  it("redirects the admin entry route to users", () => {
    signIn();
    window.history.pushState({}, "", "/admin");
    renderApp();

    expect(screen.getByRole("heading", { name: "Users" })).toBeTruthy();
  });
});
