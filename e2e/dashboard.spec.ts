import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL ?? "sa@tami.test");
  await page.locator('input[name="password"]').fill(process.env.E2E_PASSWORD ?? "Test@12345");
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/auth/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/dashboard$/);
  return (await response.json()).accessToken as string;
}

test("renders upcoming PO deadlines from the live API", async ({ page }) => {
  const accessToken = await signIn(page);
  const month = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const response = await page.request.get(
    `/api/management/dashboard/summary?periodType=month&month=${month}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  expect(response.ok()).toBeTruthy();
  const summary = await response.json();
  const upcoming = page.getByRole("region", { name: "PO sắp đến hạn", exact: true });
  await expect(upcoming).toBeVisible();
  for (const po of summary.upcomingQueue) {
    const row = upcoming
      .getByRole("row")
      .filter({ has: page.getByRole("link", { name: `Mở đơn hàng ${po.poCode}`, exact: true }) });
    await expect(row).toBeVisible();
    const [year, month, day] = po.deadline.split("-");
    await expect(row).toContainText(`${day}/${month}/${year}`);
  }
  await expect(page.getByText("Không thể tải số liệu", { exact: true })).toHaveCount(0);
});

test("Jira-style chart hover shows actual values and dims other slices", async ({
  page,
}, testInfo) => {
  await page.route(/\/api\/(?:management\/)?dashboard\/summary/, async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    await route.fulfill({
      json: {
        ...data,
        totalPurchaseOrders: 3,
        purchaseOrderStatuses: [
          { status: "in_progress", count: 2 },
          { status: "draft", count: 1 },
          { status: "cancelled", count: 1 },
        ],
        bomRevisionStatuses: [
          { status: "wait_nvkh", count: 1 },
          { status: "wait_tpkh_confirm", count: 1 },
          { status: "wait_accounting", count: 1 },
          { status: "closed", count: 1 },
        ],
        topCustomers: [
          { customerName: "KH Test", count: 2 },
          { customerName: "KH Review", count: 1 },
        ],
        upcomingProductPurchaseOrders: 1,
        upcomingQueue: [
          {
            purchaseOrderId: "00000000-0000-4000-8000-000000000001",
            poCode: "PO-NO-PRODUCTS",
            customerName: "KH Test",
            deadline: "2026-10-08",
            productCount: 0,
          },
        ],
      },
    });
  });
  await signIn(page);
  const panel = page.getByRole("region", { name: "Trạng thái PO trong kỳ" });
  const active = panel.getByRole("img", { name: "Đang xử lý: 2 PO" });
  const other = panel.getByRole("img", { name: "Nháp: 1 PO" });
  const svg = panel.getByRole("group", { name: "Trạng thái PO, tổng 4 PO" });
  await panel.scrollIntoViewIfNeeded();
  const box = await svg.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + (box!.width * 201) / 240, box!.y + box!.height / 2);
  await expect(page.getByRole("tooltip")).toContainText("Đang xử lý");
  await expect(page.getByRole("tooltip")).toContainText("2");
  await expect(active).toHaveAttribute("opacity", "1");
  await expect(other).toHaveAttribute("opacity", "0.25");
  await panel.screenshot({ path: testInfo.outputPath("donut-hover.png") });

  const npl = page.getByRole("region", { name: "Trạng thái NPL", exact: true });
  const nplRow = npl.getByRole("button", { name: "Chờ NVKH: 1 NPL", exact: true });
  await nplRow.hover();
  await expect(page.getByRole("tooltip")).toContainText("1 NPL");
  await expect(npl).not.toContainText("%");
  await expect(nplRow.locator('[style="width: 100%;"]')).toHaveCSS(
    "background-color",
    "rgb(70, 95, 255)",
  );
  await npl.screenshot({ path: testInfo.outputPath("npl-hover.png") });

  const customers = page.getByRole("region", { name: "Khách hàng có nhiều PO" });
  await customers.getByRole("button", { name: "KH Test: 2 PO" }).hover();
  await expect(page.getByRole("tooltip")).toContainText("2 PO");
  await expect(customers).not.toContainText("%");
  await customers.screenshot({ path: testInfo.outputPath("customers-hover.png") });
  await expect(page.getByRole("link", { name: "Mở đơn hàng PO-NO-PRODUCTS" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await nplRow.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
  const tooltipBox = await page.getByRole("tooltip").boundingBox();
  expect(tooltipBox!.x).toBeGreaterThanOrEqual(0);
  expect(tooltipBox!.x + tooltipBox!.width).toBeLessThanOrEqual(390);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
