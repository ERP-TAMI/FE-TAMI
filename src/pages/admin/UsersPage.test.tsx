import { MemoryRouter } from "react-router-dom";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UsersPage from "./UsersPage";
import { useAuthStore } from "@/store/authStore";

const hooks = vi.hoisted(() => ({
  useUsers: vi.fn(),
  useCreateUser: vi.fn(),
  useUpdateUser: vi.fn(),
  useResendPasswordSetup: vi.fn(),
  useUpdateUserStatus: vi.fn(),
  useResetUserPassword: vi.fn(),
}));

vi.mock("@/hooks/useUsers", () => hooks);

const user = {
  id: "9fb4d58f-0e6d-4ed5-b122-2b9f61aae115",
  fullName: "Nhân viên IT",
  email: "it@tami.test",
  phone: "0901234567",
  role: { code: "IT" as const, name: "Công nghệ thông tin" },
  accountStatus: "active" as const,
  passwordSetupRequired: false,
};

function result(overrides = {}) {
  return {
    isLoading: false,
    isFetching: false,
    isError: false,
    data: { data: [user], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

function renderPage(path = "/it/users") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <UsersPage />
    </MemoryRouter>,
  );
}

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.useUsers.mockReturnValue(result());
    hooks.useCreateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useUpdateUser.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useResendPasswordSetup.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useUpdateUserStatus.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    hooks.useResetUserPassword.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    useAuthStore.setState({
      status: "authenticated",
      accessToken: "test-token",
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "sa@tami.test",
        fullName: "Admin",
        roleCode: "SA",
        roleName: "Admin",
        permissions: ["system.users.manage"],
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders the user list with role and account status", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Quản trị người dùng" })).toBeTruthy();
    expect(screen.getByText("Nhân viên IT")).toBeTruthy();
    expect(screen.getByText("it@tami.test")).toBeTruthy();
    expect(screen.getByText("Công nghệ thông tin")).toBeTruthy();
    expect(within(screen.getByRole("table")).getByText("Đang hoạt động")).toBeTruthy();
  });

  it("lets the backend deliver a pending invitation without a duplicate resend", async () => {
    const created = {
      ...user,
      id: "22222222-2222-4222-8222-222222222222",
      accountStatus: "pending_setup" as const,
      passwordSetupRequired: true,
    };
    const create = vi.fn().mockResolvedValue({
      user: created,
      invitationStatus: "pending",
    });
    const resend = vi.fn();
    hooks.useCreateUser.mockReturnValue({ mutateAsync: create, isPending: false });
    hooks.useResendPasswordSetup.mockReturnValue({
      mutateAsync: resend,
      isPending: false,
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo người dùng" }));
    fireEvent.change(screen.getByLabelText("Họ và tên"), {
      target: { value: "Nguyễn Văn A" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@example.com" },
    });
    const submitButtons = screen.getAllByRole("button", { name: "Tạo người dùng" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(create.mock.calls[0][0]).not.toHaveProperty("accountStatus");
    expect(resend).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Đã tạo người dùng. Email đặt mật khẩu đang được gửi."),
    ).toBeTruthy();
  });

  it("does not send a duplicate email when the old backend already returned sent", async () => {
    const create = vi.fn().mockResolvedValue({
      user,
      invitationStatus: "sent",
    });
    const resend = vi.fn();
    hooks.useCreateUser.mockReturnValue({ mutateAsync: create, isPending: false });
    hooks.useResendPasswordSetup.mockReturnValue({
      mutateAsync: resend,
      isPending: false,
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Tạo người dùng" }));
    fireEvent.change(screen.getByLabelText("Họ và tên"), {
      target: { value: "Nguyễn Văn A" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "a@example.com" },
    });
    const submitButtons = screen.getAllByRole("button", { name: "Tạo người dùng" });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    expect(resend).not.toHaveBeenCalled();
    expect(await screen.findByText("Đã tạo người dùng và gửi email đặt mật khẩu.")).toBeTruthy();
  });

  it("lets the backend deliver a pending invitation after an email update", async () => {
    const pendingUser = {
      ...user,
      accountStatus: "pending_setup" as const,
      passwordSetupRequired: true,
    };
    hooks.useUsers.mockReturnValue(
      result({
        data: {
          data: [pendingUser],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      }),
    );
    const update = vi.fn().mockResolvedValue({
      user: { ...pendingUser, email: "new-address@example.com" },
      invitationStatus: "pending",
    });
    const resend = vi.fn();
    hooks.useUpdateUser.mockReturnValue({ mutateAsync: update, isPending: false });
    hooks.useResendPasswordSetup.mockReturnValue({ mutateAsync: resend, isPending: false });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Sửa" }));
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "new-address@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(resend).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Đã cập nhật người dùng. Link đặt mật khẩu đang được gửi."),
    ).toBeTruthy();
  });

  it("keeps manual password setup email resend available", async () => {
    const pendingUser = {
      ...user,
      accountStatus: "pending_setup" as const,
      passwordSetupRequired: true,
    };
    hooks.useUsers.mockReturnValue(
      result({
        data: {
          data: [pendingUser],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      }),
    );
    const resend = vi.fn().mockResolvedValue({ invitationStatus: "sent" });
    hooks.useResendPasswordSetup.mockReturnValue({ mutateAsync: resend, isPending: false });
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: `Mở thao tác cho ${pendingUser.fullName}` }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Gửi lại email" }));

    await waitFor(() => expect(resend).toHaveBeenCalledWith(pendingUser.id));
    expect(await screen.findByText("Đã gửi email đặt mật khẩu.")).toBeTruthy();
  });

  it("locks a managed account only after collecting a reason", async () => {
    const updateStatus = vi.fn().mockResolvedValue({ user });
    hooks.useUpdateUserStatus.mockReturnValue({ mutateAsync: updateStatus, isPending: false });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: `Mở thao tác cho ${user.fullName}` }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Khóa tài khoản" }));
    fireEvent.change(await screen.findByLabelText("Lý do khóa tài khoản"), {
      target: { value: "Kiểm tra truy cập bất thường" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Khóa tài khoản" }));

    await waitFor(() =>
      expect(updateStatus).toHaveBeenCalledWith({
        id: user.id,
        input: { accountStatus: "locked", reason: "Kiểm tra truy cập bất thường" },
      }),
    );
    expect(await screen.findByText("Đã khóa tài khoản.")).toBeTruthy();
  });

  it("does not expose protected SA or IT account actions to an IT actor", () => {
    const businessUser = {
      ...user,
      id: "33333333-3333-4333-8333-333333333333",
      fullName: "Nhân viên kinh doanh",
      role: { code: "NVKH" as const, name: "Nhân viên Kinh doanh" },
    };
    hooks.useUsers.mockReturnValue(
      result({
        data: {
          data: [user, businessUser],
          meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
        },
      }),
    );
    useAuthStore.setState({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "actor@tami.test",
        fullName: "IT actor",
        roleCode: "IT",
        roleName: "IT",
        permissions: ["system.users.manage"],
      },
    });

    renderPage();

    expect(screen.queryByRole("button", { name: `Mở thao tác cho ${user.fullName}` })).toBeNull();
    expect(
      screen.getByRole("button", { name: `Mở thao tác cho ${businessUser.fullName}` }),
    ).toBeTruthy();
  });

  it.each([
    ["/it/users", "/it/dashboard"],
    ["/management/users", "/management/dashboard"],
  ])("links the %s breadcrumb to its area dashboard", (path, dashboardPath) => {
    renderPage(path);

    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe(
      dashboardPath,
    );
  });

  it("shows loading, error and retry states", () => {
    const refetch = vi.fn();
    hooks.useUsers.mockReturnValue(
      result({ isLoading: true, isError: false, data: undefined, refetch }),
    );
    const view = renderPage();
    expect(screen.getByLabelText("Đang tải danh sách người dùng")).toBeTruthy();

    view.unmount();
    hooks.useUsers.mockReturnValue(
      result({
        isLoading: false,
        isError: true,
        data: undefined,
        error: new Error("offline"),
        refetch,
      }),
    );
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows an explicit empty state", () => {
    hooks.useUsers.mockReturnValue(
      result({ data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } } }),
    );
    renderPage();
    expect(screen.getByText("Không tìm thấy người dùng phù hợp.")).toBeTruthy();
  });

  it("keeps legacy users visible when phone and role are missing", () => {
    hooks.useUsers.mockReturnValue(
      result({
        data: {
          data: [{ ...user, phone: null, role: null }],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        },
      }),
    );
    renderPage();

    expect(screen.getByText("Chưa phân vai trò")).toBeTruthy();
    expect(within(screen.getByRole("table")).getAllByText("—")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /sửa/i })).toBeNull();
  });

  it("debounces search before requesting the server", async () => {
    vi.useFakeTimers();
    renderPage();

    fireEvent.change(screen.getByLabelText("Tìm kiếm người dùng"), {
      target: { value: "Nguyễn Văn" },
    });
    expect(hooks.useUsers).not.toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "Nguyễn Văn" }),
    );

    await act(async () => vi.advanceTimersByTime(300));
    expect(hooks.useUsers).toHaveBeenLastCalledWith({
      search: "Nguyễn Văn",
      role: undefined,
      status: undefined,
      page: 1,
      limit: 10,
    });
  });

  it("applies role and status filters and resets pagination", async () => {
    hooks.useUsers.mockReturnValue(
      result({ data: { data: [user], meta: { total: 11, page: 1, limit: 10, totalPages: 2 } } }),
    );
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Trang sau" }));
    expect(hooks.useUsers).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));

    fireEvent.change(screen.getByLabelText("Lọc theo vai trò"), { target: { value: "IT" } });
    const lockedStatusButton = within(
      screen.getByRole("group", { name: "Lọc theo trạng thái" }),
    ).getByRole("button", { name: "Bị khóa" });
    fireEvent.click(lockedStatusButton);
    expect(lockedStatusButton.getAttribute("aria-pressed")).toBe("true");

    await waitFor(() => {
      expect(hooks.useUsers).toHaveBeenLastCalledWith({
        search: "",
        role: "IT",
        status: "locked",
        page: 1,
        limit: 10,
      });
    });
  });
});
