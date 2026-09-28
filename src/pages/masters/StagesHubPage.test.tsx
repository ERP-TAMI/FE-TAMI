import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StagesHubPage from "./StagesHubPage";

vi.mock("./StageListPage", () => ({
  default: () => <div data-testid="stages-tab-content">Công đoạn tab content</div>,
}));
vi.mock("./StageGroupListPage", () => ({
  default: () => <div data-testid="stage-groups-tab-content">Nhóm công đoạn tab content</div>,
}));

function renderHub(initialPath = "/masters/stages") {
  const router = createMemoryRouter(
    [
      { path: "/masters/stages", element: <StagesHubPage /> },
      { path: "/masters/stages/groups", element: <StagesHubPage /> },
    ],
    { initialEntries: [initialPath] },
  );
  return { router, ...render(<RouterProvider router={router} />) };
}

describe("StagesHubPage", () => {
  afterEach(cleanup);

  it("shows only the stages tab content by default", () => {
    renderHub();

    expect(screen.getByRole("heading", { name: "Công đoạn" })).toBeTruthy();
    expect(screen.getByTestId("stages-tab-content")).toBeTruthy();
    expect(screen.queryByTestId("stage-groups-tab-content")).toBeNull();

    const breadcrumb = screen.getByRole("navigation", { name: "Điều hướng phân cấp" });
    expect(within(breadcrumb).getByText("Công đoạn")).toBeTruthy();
  });

  it("switches to the stage groups tab via the URL and mounts only that tab", async () => {
    const { router } = renderHub();
    await act(() => router.navigate("/masters/stages/groups"));

    expect(screen.getByRole("heading", { name: "Nhóm công đoạn" })).toBeTruthy();
    expect(screen.getByTestId("stage-groups-tab-content")).toBeTruthy();
    expect(screen.queryByTestId("stages-tab-content")).toBeNull();
  });

  it("navigates using the tab bar buttons and keeps a single breadcrumb on screen", () => {
    renderHub();

    const tabs = screen.getByRole("navigation", { name: "Tabs" });
    expect(within(tabs).getByRole("button", { name: "Công đoạn" })).toBeTruthy();
    expect(within(tabs).getByRole("button", { name: "Nhóm công đoạn" })).toBeTruthy();
    expect(screen.getAllByRole("navigation", { name: "Điều hướng phân cấp" })).toHaveLength(1);

    fireEvent.click(within(tabs).getByRole("button", { name: "Nhóm công đoạn" }));
    expect(screen.getByRole("heading", { name: "Nhóm công đoạn" })).toBeTruthy();
    expect(screen.getAllByRole("navigation", { name: "Điều hướng phân cấp" })).toHaveLength(1);
  });
});
