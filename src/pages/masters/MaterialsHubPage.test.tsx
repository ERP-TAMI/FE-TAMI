import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MaterialsHubPage from "./MaterialsHubPage";

vi.mock("./MaterialsPage", () => ({
  default: () => <div data-testid="materials-tab-content">Vật tư tab content</div>,
}));
vi.mock("./MaterialGroupListPage", () => ({
  default: () => <div data-testid="material-groups-tab-content">Nhóm vật tư tab content</div>,
}));
vi.mock("./UnitListPage", () => ({
  default: () => <div data-testid="units-tab-content">Đơn vị tính tab content</div>,
}));

function renderHub(initialPath = "/masters/materials") {
  const router = createMemoryRouter(
    [
      { path: "/masters/materials", element: <MaterialsHubPage /> },
      { path: "/masters/materials/groups", element: <MaterialsHubPage /> },
      { path: "/masters/materials/units", element: <MaterialsHubPage /> },
    ],
    { initialEntries: [initialPath] },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

describe("MaterialsHubPage", () => {
  afterEach(cleanup);

  it("shows only the materials tab content by default", () => {
    renderHub();

    expect(screen.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeTruthy();
    expect(screen.getByTestId("materials-tab-content")).toBeTruthy();
    expect(screen.queryByTestId("material-groups-tab-content")).toBeNull();
    expect(screen.queryByTestId("units-tab-content")).toBeNull();

    const breadcrumb = screen.getByRole("navigation", { name: "Điều hướng phân cấp" });
    expect(within(breadcrumb).getByText("Vật tư - Phụ liệu")).toBeTruthy();
  });

  it("switches to the material groups tab via the URL and mounts only that tab", async () => {
    const { router } = renderHub();
    await act(() => router.navigate("/masters/materials/groups"));

    expect(screen.getByRole("heading", { name: "Nhóm vật tư" })).toBeTruthy();
    expect(screen.getByTestId("material-groups-tab-content")).toBeTruthy();
    expect(screen.queryByTestId("materials-tab-content")).toBeNull();
    expect(screen.queryByTestId("units-tab-content")).toBeNull();
  });

  it("switches to the units tab and mounts only that tab", async () => {
    const { router } = renderHub();
    await act(() => router.navigate("/masters/materials/units"));

    expect(screen.getByRole("heading", { name: "Đơn vị tính" })).toBeTruthy();
    expect(screen.getByTestId("units-tab-content")).toBeTruthy();
    expect(screen.queryByTestId("materials-tab-content")).toBeNull();
    expect(screen.queryByTestId("material-groups-tab-content")).toBeNull();
  });

  it("navigates using the tab bar buttons and keeps a single breadcrumb on screen", () => {
    renderHub();

    const tabs = screen.getByRole("navigation", { name: "Tabs" });
    expect(within(tabs).getByRole("button", { name: /Vật tư/ })).toBeTruthy();
    expect(within(tabs).getByRole("button", { name: "Nhóm vật tư" })).toBeTruthy();
    expect(within(tabs).getByRole("button", { name: "Đơn vị tính" })).toBeTruthy();
    expect(screen.getAllByRole("navigation", { name: "Điều hướng phân cấp" })).toHaveLength(1);

    fireEvent.click(within(tabs).getByRole("button", { name: "Nhóm vật tư" }));
    expect(screen.getByRole("heading", { name: "Nhóm vật tư" })).toBeTruthy();
    expect(screen.getAllByRole("navigation", { name: "Điều hướng phân cấp" })).toHaveLength(1);
  });
});
