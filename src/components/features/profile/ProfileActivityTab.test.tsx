import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditApi } from "@/api/audit.api";
import type { AuthUser } from "@/store/authStore";
import { ProfileActivityTab } from "./ProfileActivityTab";

vi.mock("@/api/audit.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/audit.api")>();
  return {
    ...actual,
    auditApi: { ...actual.auditApi, getEntityHistory: vi.fn() },
  };
});

const user: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "it@tami.test",
  fullName: "Công nghệ thông tin",
  phone: "0912345678",
  roleCode: "IT",
  roleName: "Công nghệ thông tin",
  permissions: ["system.users.manage"],
  purchaseOrderMode: "READ_ONLY",
};

function renderActivityTab(profileUser: AuthUser) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ProfileActivityTab user={profileUser} />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

beforeEach(() => {
  vi.mocked(auditApi.getEntityHistory).mockReset();
});

afterEach(() => {
  cleanup();
});

describe("ProfileActivityTab", () => {
  it("loads actual activity for the current user when their permission allows it", async () => {
    vi.mocked(auditApi.getEntityHistory).mockResolvedValue({
      items: [
        {
          id: "activity-1",
          occurredAt: "2026-10-01T04:30:00.000Z",
          eventType: "login",
          actorUserId: user.id,
          actorName: user.fullName,
          actorRole: user.roleCode,
          targetLabel: user.email,
          reason: null,
          changes: [],
        },
      ],
      total: 1,
      page: 1,
      limit: 8,
      totalPages: 1,
    });

    const { queryClient } = renderActivityTab(user);

    expect(await screen.findByText("Đăng nhập thành công")).toBeTruthy();
    expect(auditApi.getEntityHistory).toHaveBeenCalledWith({
      aggregateType: "User",
      aggregateId: user.id,
      page: 1,
      limit: 8,
    });
    queryClient.clear();
  });

  it("loads only the current user's activity without user-management permission", async () => {
    const ownUser = { ...user, permissions: [] };
    vi.mocked(auditApi.getEntityHistory).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 8,
      totalPages: 0,
    });

    const { queryClient } = renderActivityTab(ownUser);

    expect(await screen.findByText("Chưa có dữ liệu hoạt động để hiển thị."))
      .toBeTruthy();
    expect(auditApi.getEntityHistory).toHaveBeenCalledWith({
      aggregateType: "User",
      aggregateId: ownUser.id,
      page: 1,
      limit: 8,
    });
    queryClient.clear();
  });

  it("follows the audit API pagination contract when viewing older activity", async () => {
    vi.mocked(auditApi.getEntityHistory)
      .mockResolvedValueOnce({
        items: [
          {
            id: "activity-1",
            occurredAt: "2026-10-01T04:30:00.000Z",
            eventType: "login",
            actorUserId: user.id,
            actorName: user.fullName,
            actorRole: user.roleCode,
            targetLabel: user.email,
            reason: null,
            changes: [],
          },
        ],
        total: 9,
        page: 1,
        limit: 8,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "activity-9",
            occurredAt: "2026-09-30T04:30:00.000Z",
            eventType: "updated",
            actorUserId: user.id,
            actorName: user.fullName,
            actorRole: user.roleCode,
            targetLabel: user.email,
            reason: null,
            changes: [
              {
                fieldName: "fullName",
                fieldLabel: "fullName",
                oldValue: "IT",
                newValue: "Công nghệ thông tin",
              },
            ],
          },
        ],
        total: 9,
        page: 2,
        limit: 8,
        totalPages: 2,
      });

    const { queryClient } = renderActivityTab(user);

    expect(await screen.findByText("Đăng nhập thành công")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Trang 2" }));

    expect(await screen.findByText("Cập nhật họ và tên")).toBeTruthy();
    expect(screen.getByText("Họ và tên")).toBeTruthy();
    expect(screen.queryByText("fullName")).toBeNull();
    await waitFor(() => {
      expect(auditApi.getEntityHistory).toHaveBeenLastCalledWith({
        aggregateType: "User",
        aggregateId: user.id,
        page: 2,
        limit: 8,
      });
    });
    queryClient.clear();
  });

  it("offers retry after an activity request fails", async () => {
    vi.mocked(auditApi.getEntityHistory)
      .mockRejectedValueOnce(new Error("Request failed"))
      .mockResolvedValueOnce({ items: [], total: 0, page: 1, limit: 8, totalPages: 0 });

    const { queryClient } = renderActivityTab(user);

    expect(await screen.findByText("Không tải được lịch sử hoạt động"))
      .toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));

    expect(await screen.findByText("Chưa có dữ liệu hoạt động để hiển thị."))
      .toBeTruthy();
    queryClient.clear();
  });
});
