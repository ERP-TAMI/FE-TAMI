import { expect, test, type Page } from "@playwright/test";

const createTestAccessToken = () => {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ exp: 2000000000 })}.test`;
};

const session = {
  accessToken: createTestAccessToken(),
  user: {
    id: "11111111-1111-1111-1111-111111111111",
    email: "sa@tami.test",
    fullName: "Quản trị hệ thống",
    phone: null,
    roleCode: "SA",
    roleName: "Quản trị hệ thống",
    permissions: [],
  },
};

const material = {
  id: "9c6f6f2e-2b7a-4c2e-8b8a-1a2b3c4d5e6f",
  materialCode: "FAB-001",
  materialName: "Vải chính E2E",
  materialGroupId: null,
  materialGroupName: null,
  defaultUnitId: "0a989bfe-fb34-489c-b5fe-30f74a1dc09d",
  defaultUnitName: "Mét",
  defaultYieldPct: "2.500",
  status: "active" as const,
  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
};
const materialGroup = {
  id: "c8404d89-315f-49e9-bf81-b05f0f410c4a",
  name: "Nhóm vải chính E2E",
  status: "active" as const,
};
const unit = {
  id: "0a989bfe-fb34-489c-b5fe-30f74a1dc09d",
  name: "Mét",
  status: "active" as const,
};
const stage = {
  id: "64bfc097-69d1-43f5-af97-cb0e7428f7df",
  stageCode: "GD-CAT",
  stageName: "Cắt vải E2E",
  description: null,
  ssv: "12.500",
  status: "active" as const,
};
const stageGroup = {
  id: "771c0dc2-cd59-44e3-9b16-cacb200f20e5",
  groupCode: "NS-MAY",
  groupName: "Nhóm may E2E",
  description: null,
  status: "active" as const,
  itemCount: 1,
  createdAt: "2026-08-24T01:00:00.000Z",
  updatedAt: "2026-08-24T01:00:00.000Z",
};

async function mockBackend(page: Page) {
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (["/api/auth/login", "/api/auth/refresh"].includes(path)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(session),
      });
      return;
    }

    const listFixtures: Record<string, unknown[]> = {
      "/api/masters/materials": [material],
      "/api/masters/material-groups": [materialGroup],
      "/api/masters/units": [unit],
      "/api/masters/stages": [stage],
      "/api/masters/stage-groups": [stageGroup],
    };
    const matchedResource = Object.keys(listFixtures).find(
      (resource) => path === resource || path.startsWith(`${resource}/`),
    );

    if (!matchedResource) {
      await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
      return;
    }

    if (method === "GET" && path === matchedResource) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(listFixtures[matchedResource]),
      });
      return;
    }

    if (method === "DELETE") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    // Minimal echo for create/update/status mutations — this spec exercises
    // the tab-bar UI, not per-entity save correctness (covered elsewhere).
    const body = (request.postDataJSON() as Record<string, unknown>) ?? {};
    const fixture = listFixtures[matchedResource][0] as Record<string, unknown>;
    await route.fulfill({
      status: method === "POST" ? 201 : 200,
      contentType: "application/json",
      body: JSON.stringify({ ...fixture, ...body, id: fixture.id }),
    });
  });
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("sa@tami.test");
  await page.getByLabel("Mật khẩu").fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("Masters hub pages (real browser, mocked HTTP boundary)", () => {
  test("sidebar collapses Vật tư, Nhóm vật tư, and Đơn vị tính into one hub page", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await mockBackend(page);
    await login(page);

    await page.getByRole("button", { name: "Dữ liệu chung" }).click();
    const sidebar = page.getByRole("complementary", { name: "Primary navigation" });
    await expect(sidebar.getByRole("link", { name: "Vật tư" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Công đoạn" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Xưởng sản xuất" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Bảng Size" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Nhóm vật tư" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "Đơn vị tính" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "Nhóm công đoạn" })).toHaveCount(0);

    await sidebar.getByRole("link", { name: "Vật tư" }).click();
    await expect(page.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("Vật tư hub switches tabs independently and every create button opens/closes cleanly", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await mockBackend(page);
    await login(page);

    await page.goto("/masters/materials");
    await expect(page.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeVisible();
    await expect(page.getByText(material.materialName, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Tạo vật tư mới" }).click();
    await expect(page.getByRole("heading", { name: "Tạo vật tư" })).toBeVisible();
    await page.getByRole("button", { name: "Hủy" }).click();
    await expect(page.getByRole("heading", { name: "Tạo vật tư" })).toHaveCount(0);

    const tabs = page.getByRole("navigation", { name: "Tabs" });
    await tabs.getByRole("button", { name: "Nhóm vật tư" }).click();
    await expect(page).toHaveURL(/\/masters\/materials\/groups$/);
    await expect(page.getByRole("heading", { name: "Nhóm vật tư", exact: true })).toBeVisible();
    await expect(page.getByText(materialGroup.name, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tạo nhóm vật tư mới" }).click();
    await expect(page.getByRole("heading", { name: "Tạo nhóm vật tư" })).toBeVisible();
    await page.getByRole("button", { name: "Hủy" }).click();

    await tabs.getByRole("button", { name: "Đơn vị tính" }).click();
    await expect(page).toHaveURL(/\/masters\/materials\/units$/);
    await expect(page.getByRole("heading", { name: "Đơn vị tính", exact: true })).toBeVisible();
    await expect(page.getByText(unit.name, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tạo đơn vị tính mới" }).click();
    await expect(page.getByRole("heading", { name: "Tạo đơn vị tính" })).toBeVisible();
    await page.getByRole("button", { name: "Hủy" }).click();

    // Independent state: switching back shows the materials tab fresh, unaffected by the other tabs.
    await tabs.getByRole("button", { name: /^Vật tư$/ }).click();
    await expect(page).toHaveURL(/\/masters\/materials$/);
    await expect(page.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeVisible();
    await expect(page.getByText(material.materialName, { exact: true })).toBeVisible();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await expect(page.getByRole("heading", { name: "Vật tư - Phụ liệu" })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test("Công đoạn hub blocks losing unsaved bulk SSV edits when switching tabs", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await mockBackend(page);
    await login(page);

    await page.goto("/masters/stages");
    await expect(page.getByRole("heading", { name: "Công đoạn", exact: true })).toBeVisible();
    await expect(page.getByText(stage.stageName, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Tạo công đoạn mới" }).click();
    await expect(page.getByRole("heading", { name: "Tạo công đoạn" })).toBeVisible();
    await page.getByRole("button", { name: "Hủy" }).click();

    await page.getByRole("button", { name: "Sửa SSV" }).click();
    await page.getByLabel(`SSV cho ${stage.stageCode}`).fill("99.000");

    const tabs = page.getByRole("navigation", { name: "Tabs" });
    await tabs.getByRole("button", { name: "Nhóm công đoạn" }).click();
    await expect(page.getByRole("heading", { name: "Hủy sửa SSV?" })).toBeVisible();
    await expect(page).toHaveURL(/\/masters\/stages$/);

    await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
    await expect(page.getByLabel(`SSV cho ${stage.stageCode}`)).toHaveValue("99.000");

    await tabs.getByRole("button", { name: "Nhóm công đoạn" }).click();
    await page.getByRole("button", { name: "Bỏ thay đổi" }).click();
    await expect(page).toHaveURL(/\/masters\/stages\/groups$/);
    await expect(page.getByRole("heading", { name: "Nhóm công đoạn", exact: true })).toBeVisible();
    await expect(page.getByText(stageGroup.groupName, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Tạo nhóm công đoạn" }).click();
    await expect(page.getByRole("heading", { name: "Tạo nhóm công đoạn" })).toBeVisible();
    await page.getByRole("button", { name: "Hủy" }).click();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);

    expect(consoleErrors).toEqual([]);
  });
});
