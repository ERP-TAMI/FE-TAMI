import { expect, test } from "@playwright/test";
import { stat } from "node:fs/promises";

const SA = { email: "sa@tami.test", password: "123456" };

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(SA.email);
  await page.getByLabel("Mật khẩu").fill(SA.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("Style operation steps editor", () => {
  test("downloads the operation steps Excel workbook", async ({ page }) => {
    await login(page);
    await page.goto("/styles");

    const detailLink = page.locator('a[href*="/styles/"][href$="/detail"]').first();
    const href = await detailLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(`/styles/${href!.split("/").at(-2)}/operation-steps`);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Xuất Excel" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/i);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    expect((await stat(downloadPath!)).size).toBeGreaterThan(1_000);
  });

  test("enters edit mode and expands to full-screen editor chrome", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await login(page);
    await page.goto("/styles");

    const detailLink = page.locator('a[href*="/styles/"][href$="/detail"]').first();
    await expect(detailLink).toBeVisible();

    const href = await detailLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(`/styles/${href!.split("/").at(-2)}/operation-steps`);

    const sidebarBox = await page.getByLabel("Primary navigation").boundingBox();
    expect(sidebarBox?.width).toBe(250);
    await expect(page.getByRole("columnheader", { name: "Chỉ tiêu tổng" })).toBeInViewport();

    const imagePanel = page.getByRole("heading", { name: "Ảnh rập / Cấu trúc" }).locator("../..");
    const tablePanel = page.getByRole("heading", { name: "Bảng quy trình công đoạn mẫu Fit" }).locator("../..");
    const imagePanelBox = await imagePanel.boundingBox();
    const tablePanelBox = await tablePanel.boundingBox();
    expect(tablePanelBox!.width).toBeGreaterThan(imagePanelBox!.width * 4);

    const commonNote = page.locator("tbody td[data-common-note]");
    await expect(commonNote).toHaveCount(1);

    await expect(page.getByRole("button", { name: "Chỉnh sửa" })).toBeVisible();
    await page.getByRole("button", { name: "Chỉnh sửa" }).click();

    await expect(page.getByRole("button", { name: /Lưu quy trình/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Thêm công đoạn" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xuất Excel" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sao chép công đoạn" })).toHaveCount(0);
    await expect(page.getByRole("textbox", { name: "Ghi chú chung" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Ảnh rập / Cấu trúc" })).toHaveCount(0);
    await expect(page.getByText("Có thay đổi chưa lưu")).toHaveCount(0);

    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe("hidden");
    await expect(page.locator("div.fixed.inset-0")).toHaveCount(1);

    const card = page.locator("div.overflow-hidden.rounded-2xl").first();
    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(box!.x).toBeGreaterThan(20);
    expect(box!.x + box!.width).toBeLessThan(viewport!.width - 20);

    await page.getByRole("button", { name: "Hủy" }).click();
    await expect(page.getByRole("button", { name: "Chỉnh sửa" })).toBeVisible();
    await expect(page.locator("div.fixed.inset-0")).toHaveCount(0);

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    await page.locator("div.fixed.inset-0").click({ position: { x: 4, y: 4 } });
    await expect(page.getByRole("button", { name: "Chỉnh sửa" })).toBeVisible();
  });

  test("keeps the edit popup wide enough on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.goto("/styles");

    const detailLink = page.locator('a[href*="/styles/"][href$="/detail"]').first();
    const href = await detailLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(`/styles/${href!.split("/").at(-2)}/operation-steps`);

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();

    const card = page.locator("div.overflow-hidden.rounded-2xl").first();
    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(360);
    expect(box!.x).toBeGreaterThan(4);
    await expect(page.getByRole("heading", { name: "Ảnh rập / Cấu trúc" })).toHaveCount(0);
    await expect(page.getByText("Có thay đổi chưa lưu")).toHaveCount(0);
  });

  test("shows delete confirmation and jumps to an invalid empty row", async ({ page }) => {
    await login(page);
    await page.goto("/styles");

    const detailLink = page.locator('a[href*="/styles/"][href$="/detail"]').first();
    const href = await detailLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(`/styles/${href!.split("/").at(-2)}/operation-steps`);

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();

    await page.getByTitle("Xóa công đoạn").first().click();
    const deleteDialog = page.getByRole("dialog", { name: "Xóa công đoạn" });
    await expect(deleteDialog).toBeVisible();
    await expect(deleteDialog).toBeInViewport();

    await deleteDialog.getByRole("button", { name: "Hủy" }).click();
    await expect(deleteDialog).toHaveCount(0);

    await page.getByRole("button", { name: /Thêm công đoạn/i }).click();
    await page.getByRole("button", { name: /Lưu quy trình/i }).click();

    const rowError = page.getByRole("alert", { name: "" }).filter({ hasText: "Vui lòng chọn tên công đoạn" });
    await expect(rowError).toBeVisible();
    await expect(rowError).toBeInViewport();
    await expect(page.locator('input[aria-invalid="true"]')).toBeFocused();
  });

  test("adds a stage group with selected child operations without saving", async ({ page }) => {
    await login(page);
    await page.goto("/styles");

    const detailLink = page.locator('a[href*="/styles/"][href$="/detail"]').first();
    const href = await detailLink.getAttribute("href");
    expect(href).toBeTruthy();
    await page.goto(`/styles/${href!.split("/").at(-2)}/operation-steps`);

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    await page.getByRole("button", { name: "Thêm công đoạn" }).click();
    await page.getByPlaceholder("Tìm công đoạn...").last().fill("Test");
    await page.getByText("Test (Nhóm công đoạn)", { exact: true }).click();

    const groupDialog = page.getByRole("dialog", { name: "Sửa công đoạn nhóm: Test" });
    await expect(groupDialog).toBeVisible();
    await groupDialog.getByLabel(/Chọn tất cả/).check();
    await groupDialog.getByRole("button", { name: "Cập nhật nhóm (3)" }).click();

    await expect(page.getByTitle("Sửa nhóm công đoạn")).toBeVisible();
    await expect
      .poll(() =>
        page
          .getByPlaceholder("Tìm công đoạn...")
          .evaluateAll((inputs) => inputs.some((input) => (input as HTMLInputElement).value === "abcc")),
      )
      .toBe(true);

    await page.getByRole("button", { name: "Hủy" }).click();
    await page.getByRole("button", { name: "Bỏ thay đổi" }).click();
    await expect(page.getByRole("button", { name: "Chỉnh sửa" })).toBeVisible();
  });
});
