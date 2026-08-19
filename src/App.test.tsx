import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { ThemeProvider } from "@/context/ThemeContext";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.history.pushState({}, "", "/dashboard");
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
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

    expect(screen.getByRole("heading", { name: "Material groups" })).toBeTruthy();
  });

  it("provides sidebar navigation from material groups to materials", () => {
    window.history.pushState({}, "", "/masters/material-groups");
    renderApp();

    const materialsLink = screen.getByRole("link", { name: "Materials" });
    expect(materialsLink.getAttribute("href")).toBe("/masters/materials");

    fireEvent.click(materialsLink);
    expect(screen.getByRole("heading", { name: "Materials" })).toBeTruthy();
  });

  it("redirects the admin entry route to users", () => {
    window.history.pushState({}, "", "/admin");
    renderApp();

    expect(screen.getByRole("heading", { name: "Users" })).toBeTruthy();
  });
});
