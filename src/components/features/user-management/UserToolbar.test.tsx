import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserToolbar } from "./UserToolbar";

describe("UserToolbar", () => {
  afterEach(cleanup);

  it("renders status filters as wrapping standalone chips", () => {
    render(
      <UserToolbar
        search=""
        role=""
        status=""
        onSearchChange={vi.fn()}
        onRoleChange={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );

    const group = screen.getByRole("group", { name: "Lọc theo trạng thái" });
    expect(group.className).toContain("flex-wrap");
    expect(group.className).not.toContain("border-gray-300");
    expect(screen.getByRole("button", { name: "Hoạt động" }).className).toContain(
      "border-gray-200",
    );
  });

  it("keeps the status filter interaction unchanged", () => {
    const onStatusChange = vi.fn();
    render(
      <UserToolbar
        search=""
        role=""
        status="locked"
        onSearchChange={vi.fn()}
        onRoleChange={vi.fn()}
        onStatusChange={onStatusChange}
      />,
    );

    const locked = screen.getByRole("button", { name: "Bị khóa" });
    expect(locked.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Chờ mật khẩu" }));
    expect(onStatusChange).toHaveBeenCalledWith("pending_setup");
  });
});
