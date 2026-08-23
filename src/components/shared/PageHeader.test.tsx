import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageHeader } from "./PageHeader";

function renderWithRouter(ui: ReactNode) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("PageHeader", () => {
  afterEach(cleanup);

  it("renders a breadcrumb, title, and runs the action on click", () => {
    const onClick = vi.fn();
    renderWithRouter(
      <PageHeader
        breadcrumb={[{ label: "Danh mục" }, { label: "Nhóm vật tư" }]}
        title="Nhóm vật tư"
        action={{ label: "Tạo nhóm vật tư mới", onClick }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Nhóm vật tư" })).toBeTruthy();
    expect(screen.getByText("Danh mục")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Tạo nhóm vật tư mới" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders breadcrumb items with links as navigable, and stats as text", () => {
    renderWithRouter(
      <PageHeader
        breadcrumb={[{ label: "Dashboard", to: "/dashboard" }, { label: "Mẫu Fit" }]}
        title="Mẫu Fit"
        stats={[
          { label: "mẫu", value: 3 },
          { label: "hoạt động", value: 2, tone: "success" },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe(
      "/dashboard",
    );
    expect(screen.getByText("3 mẫu")).toBeTruthy();
    expect(screen.getByText("2 hoạt động")).toBeTruthy();
  });
});
