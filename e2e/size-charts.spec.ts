import { expect, test } from "@playwright/test";

const session = {
  accessToken: "e30.eyJleHAiOjQxMDI0NDQ4MDB9.signature",
  user: {
    id: "11111111-1111-1111-1111-111111111111",
    email: "sa@tami.test",
    fullName: "Quản trị hệ thống",
    roleCode: "SA",
    roleName: "Quản trị hệ thống",
    permissions: [],
  },
};

const firstChart = {
  id: "f4ab3c98-2941-42e9-a92a-1e90f6087fd0",
  name: "Áo sơ mi nam",
  sizes: ["XS", "S", "M", "L"],
  status: "active" as const,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
};

test.describe("Size Charts management (real browser, mocked HTTP boundary)", () => {
  test("validates, creates, deactivates, and stays usable at 375px", async ({ page }) => {
    const consoleErrors: string[] = [];
    const mutationRequests: Array<{ method: string; url: string; body: unknown }> = [];
    const charts = [{ ...firstChart }];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const method = request.method();

      if (["/api/auth/login", "/api/auth/refresh"].includes(url.pathname)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(session),
        });
        return;
      }

      if (!url.pathname.startsWith("/api/masters/size-charts")) {
        await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
        return;
      }

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(charts),
        });
        return;
      }

      if (method === "DELETE") {
        mutationRequests.push({ method, url: url.pathname, body: undefined });
        const chartIndex = charts.findIndex((item) => url.pathname.endsWith(item.id));
        if (chartIndex < 0) {
          await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
          return;
        }
        charts.splice(chartIndex, 1);
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      const body = request.postDataJSON() as Record<string, unknown>;
      mutationRequests.push({ method, url: url.pathname, body });

      if (method === "POST") {
        const created = {
          ...firstChart,
          id: "c42ec89d-2cf3-49fb-80fc-1407b74eef04",
          name: body.name as string,
          sizes: body.sizes as string[],
        };
        charts.push(created);
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(created),
        });
        return;
      }

      const chart = charts.find((item) => url.pathname.includes(item.id));
      if (!chart) {
        await route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
        return;
      }
      if (url.pathname.endsWith("/status")) chart.status = body.status as "active" | "inactive";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(chart),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("sa@tami.test");
    await page.getByLabel("Mật khẩu").fill("123456");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/masters/size-charts");
    await expect(page.getByRole("heading", { name: "Bảng Size" })).toBeVisible();
    await expect(page.getByText("Áo sơ mi nam", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xóa" })).toHaveCount(1);

    await page.getByRole("button", { name: "Tạo bảng Size" }).click();
    const form = page.getByRole("dialog");
    await form.getByLabel("Tên bảng Size").fill("Áo thun E2E");
    const sizeInput = form.getByLabel("Nhập Size");
    await sizeInput.fill("S");
    await sizeInput.press("Enter");
    await sizeInput.fill("s");
    await sizeInput.press("Enter");
    await expect(form.getByText('Size "s" đã tồn tại')).toBeVisible();

    await sizeInput.fill("M, L, XL, 2XL, 3XL, Size đặc biệt");
    const chipList = form.getByRole("list", { name: "Danh sách Size đã thêm" });
    await expect(chipList.getByRole("listitem")).toHaveCount(7);
    expect(await chipList.evaluate((element) => getComputedStyle(element).flexWrap)).toBe("wrap");
    await page.setViewportSize({ width: 375, height: 812 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await page.setViewportSize({ width: 1280, height: 720 });
    await form.getByRole("button", { name: "Tạo bảng Size" }).click();
    await expect(page.getByText("Áo thun E2E", { exact: true })).toBeVisible();
    expect(mutationRequests[0]).toEqual({
      method: "POST",
      url: "/api/masters/size-charts",
      body: {
        name: "Áo thun E2E",
        sizes: ["S", "M", "L", "XL", "2XL", "3XL", "Size đặc biệt"],
      },
    });

    await page.getByRole("switch", { name: "Tắt Áo sơ mi nam" }).click();
    const confirm = page.getByRole("dialog");
    await expect(confirm.getByText(/PO và tài liệu lịch sử vẫn giữ nguyên/)).toBeVisible();
    await confirm.getByRole("button", { name: "Tắt bảng Size" }).click();
    await expect(page.getByRole("switch", { name: "Bật Áo sơ mi nam" })).toBeVisible();

    const createdRow = page.getByRole("row", { name: /Áo thun E2E/ });
    await createdRow.getByRole("button", { name: "Xóa" }).click();
    const deleteDialog = page.getByRole("dialog");
    await expect(
      deleteDialog.getByText(/chỉ có thể xóa khi chưa có dữ liệu tham chiếu/i),
    ).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Xóa bảng Size" }).click();
    await expect(page.getByText("Áo thun E2E", { exact: true })).toHaveCount(0);
    expect(mutationRequests).toContainEqual({
      method: "DELETE",
      url: "/api/masters/size-charts/c42ec89d-2cf3-49fb-80fc-1407b74eef04",
      body: undefined,
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByRole("heading", { name: "Bảng Size" })).toBeVisible();
    await expect(page.getByLabel("Tìm kiếm bảng Size")).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    expect(consoleErrors).toEqual([]);
  });
});
