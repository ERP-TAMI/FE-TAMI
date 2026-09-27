import { expect, test } from "@playwright/test";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

test("creates, edits, uploads an image to, and removes an image from a Fit sample round", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const uniqueSuffix = Date.now();
  const styleCode = `E2E-ROUND-${uniqueSuffix}`;
  const styleName = `E2E Sample Round Test ${uniqueSuffix}`;

  await page.goto("/login");
  await page.getByLabel("Email").fill("nvkh@tami.test");
  await page.getByLabel("Mật khẩu").fill("Test@12345");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/styles");
  await page.getByRole("button", { name: "+ Tạo Mẫu Fit Mới" }).click();
  await page.locator("#style-code").fill(styleCode);
  await page.locator("#style-name").fill(styleName);
  await page.getByRole("button", { name: "Tạo Mới" }).click();

  await page.getByRole("link", { name: styleCode }).click();
  await expect(page).toHaveURL(/\/styles\/.+\/detail$/);

  await page.getByRole("button", { name: "Lần may mẫu" }).click();
  await expect(page).toHaveURL(/\/styles\/.+\/sample-rounds$/);
  await expect(page.getByText("Chưa có lần may mẫu nào.")).toBeVisible();

  // Create round 1
  await page.getByRole("button", { name: "Thêm lần may mẫu" }).click();
  await page
    .getByPlaceholder("Nhận xét về lần may mẫu này...")
    .fill(`Ghi chú E2E ${uniqueSuffix}`);
  await page.getByRole("button", { name: "Tạo lần may mẫu" }).click();

  await expect(page.getByText("Đã thêm lần may mẫu mới.")).toBeVisible();
  await expect(page.getByText("Lần 1")).toBeVisible();
  await expect(page.getByText("Đang làm")).toBeVisible();
  await expect(page.getByText(`Ghi chú E2E ${uniqueSuffix}`)).toBeVisible();

  // Edit round 1: move status to Đạt
  await page.getByRole("button", { name: "Sửa" }).click();
  await expect(page.getByText("Sửa lần may mẫu 1")).toBeVisible();
  await page.locator("select").selectOption("approved");
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();

  await expect(page.getByText("Đã cập nhật lần may mẫu.")).toBeVisible();
  await expect(page.getByText("Đạt", { exact: true })).toBeVisible();

  // Change status inline from the card, without opening the edit modal
  await page.getByTitle("Bấm để đổi trạng thái").click();
  await page.getByRole("option", { name: "Chưa đạt" }).click();
  await expect(page.getByText("Đã cập nhật trạng thái.")).toBeVisible();
  await expect(page.getByTitle("Bấm để đổi trạng thái")).toContainText("Chưa đạt");

  // Upload an image to the round
  const tempDir = mkdtempSync(join(tmpdir(), "erp-e2e-"));
  const filePath = join(tempDir, "sample-round.png");
  // Minimal valid 1x1 PNG so client-side validateImageFile accepts it.
  writeFileSync(
    filePath,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
  );

  await page.locator('input[type="file"]').setInputFiles(filePath);
  await expect(page.locator('img[alt="sample-round.png"]')).toBeVisible({ timeout: 20000 });

  await page.reload();
  await expect(page.locator('img[alt="sample-round.png"]')).toBeVisible({ timeout: 20000 });

  // Open the fullscreen viewer and close it again
  await page.locator('img[alt="sample-round.png"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("sample-round.png", { exact: true })).toBeVisible();
  await page.getByLabel("Đóng").click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Remove the image
  await page.getByTitle("Gỡ ảnh").click();
  await page.getByRole("button", { name: "Xoá ảnh" }).click();

  await expect(page.getByText("Đã xoá ảnh khỏi lần may mẫu.")).toBeVisible();
  await expect(page.locator('img[alt="sample-round.png"]')).toHaveCount(0);

  expect(errors).toEqual([]);
});
