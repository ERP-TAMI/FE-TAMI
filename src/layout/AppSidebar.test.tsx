import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SidebarProvider } from "@/context/SidebarContext";
import { useAuthStore } from "@/store/authStore";
import AppSidebar from "./AppSidebar";

function setPermissions(permissions: string[]) {
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "user@example.com",
      fullName: "Test User",
      phone: null,
      roleCode: "RD",
      roleName: "R&D",
      permissions,
      purchaseOrderMode: "FULL_ACCESS",
    },
  });
}

function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe("AppSidebar", () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ user: null });
  });

  it("groups Fit styles and the document library under Fit management", () => {
    setPermissions(["master_data.styles.view", "master_data.documents.view"]);
    renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: "Quản lý Mẫu Fit" }));

    expect(screen.getByRole("link", { name: "Mẫu Fit" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Kho tài liệu" })).toBeTruthy();
  });

  it("shows only the Fit sections the user can view", () => {
    setPermissions(["master_data.styles.view"]);
    renderSidebar();

    fireEvent.click(screen.getByRole("button", { name: "Quản lý Mẫu Fit" }));

    expect(screen.getByRole("link", { name: "Mẫu Fit" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Kho tài liệu" })).toBeNull();
  });
});
