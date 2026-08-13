import { cleanup, render, screen } from "@testing-library/react";
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
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
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

  it("redirects the admin entry route to users", () => {
    window.history.pushState({}, "", "/admin");
    renderApp();

    expect(screen.getByRole("heading", { name: "Users" })).toBeTruthy();
  });
});
