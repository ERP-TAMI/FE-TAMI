import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { ThemeProvider } from "@/context/ThemeContext";
import { materialGroupApi } from "@/features/master-data/material-groups/api/material-group.api";

vi.mock("@/features/master-data/material-groups/api/material-group.api", () => ({
  materialGroupApi: {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.history.pushState({}, "", "/dashboard");
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.mocked(materialGroupApi.list).mockResolvedValue([]);
});

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
    renderApp();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Primary navigation" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Vật tư" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Materials" })).toBeNull();
  });

  it("renders the public login route", () => {
    window.history.pushState({}, "", "/login");
    renderApp();

    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeTruthy();
  });

  it("redirects the masters entry route to materials", () => {
    window.history.pushState({}, "", "/masters");
    renderApp();

    expect(screen.getByRole("heading", { name: "Materials" })).toBeTruthy();
  });

  it("renders the material groups management route", () => {
    window.history.pushState({}, "", "/masters/material-groups");
    renderApp();

    expect(screen.getByRole("heading", { name: "Nhóm vật tư" })).toBeTruthy();
  });

  it("redirects the admin entry route to users", () => {
    window.history.pushState({}, "", "/admin");
    renderApp();

    expect(screen.getByRole("heading", { name: "Users" })).toBeTruthy();
  });
});
