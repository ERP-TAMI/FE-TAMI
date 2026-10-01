import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthUser } from "@/store/authStore";
import { EditProfileModal } from "./EditProfileModal";

const user: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "it@tami.test",
  fullName: "Công nghệ thông tin",
  phone: "0868899104",
  roleCode: "IT",
  roleName: "Công nghệ thông tin",
  permissions: ["dashboard.view"],
  purchaseOrderMode: "READ_ONLY",
};

afterEach(cleanup);

describe("EditProfileModal", () => {
  it("only shows fields that the profile endpoint allows updating", () => {
    render(
      <EditProfileModal
        open={true}
        user={user}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Họ và tên")).toBeTruthy();
    expect(screen.getByLabelText("Số điện thoại")).toBeTruthy();
    expect(screen.queryByLabelText("Địa chỉ email")).toBeNull();
    expect(screen.queryByLabelText("Vai trò")).toBeNull();
  });

  it("cannot be dismissed while the profile request is running", () => {
    const onClose = vi.fn();

    render(
      <EditProfileModal
        open={true}
        user={user}
        isSubmitting={true}
        onSubmit={vi.fn()}
        onClose={onClose}
      />,
    );

    expect(
      (screen.getByRole("button", { name: "Đóng hộp thoại" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders modal when open and submits valid profile values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(
      <EditProfileModal
        open={true}
        user={user}
        isSubmitting={false}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("heading", { name: "Chỉnh sửa hồ sơ" })).toBeTruthy();
    expect((screen.getByLabelText("Họ và tên") as HTMLInputElement).value).toBe(
      "Công nghệ thông tin",
    );
    expect(screen.getByDisplayValue("0868899104")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Họ và tên"), {
      target: { value: "Nguyễn Văn IT" },
    });
    fireEvent.change(screen.getByLabelText("Số điện thoại"), {
      target: { value: "0912345678" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        fullName: "Nguyễn Văn IT",
        phone: "0912345678",
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn();

    render(
      <EditProfileModal
        open={true}
        user={user}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onClose).toHaveBeenCalled();
  });
});
