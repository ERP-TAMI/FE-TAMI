import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/store/authStore";
import AccountMenu from "./AccountMenu";

afterEach(cleanup);

function renderMenu(area: "management" | "employee" | "it") {
  useAuthStore.setState({
    status: "authenticated",
    accessToken: "token",
    user: {
      id: "11111111-1111-4111-8111-111111111111",
      email: "it@tami.test",
      fullName: "Nhân viên IT",
      phone: null,
      roleCode: "IT",
      roleName: "Công nghệ thông tin",
      permissions: [],
    },
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <AccountMenu area={area} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Tài khoản" }));
  return screen.getByRole("link", { name: "Tài khoản của tôi" });
}

describe("AccountMenu", () => {
  it.each([
    ["management", "/management/profile"],
    ["it", "/it/profile"],
    ["employee", "/profile"],
  ] as const)("links the %s shell to its profile route", (area, path) => {
    expect(renderMenu(area).getAttribute("href")).toBe(path);
  });
});
