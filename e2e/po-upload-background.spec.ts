import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const SA = {
  email: process.env.E2E_EMAIL ?? "sa@tami.test",
  password: process.env.E2E_PASSWORD ?? "Test@12345",
};
const FILE_COUNT = 8;

function makeFiles(n: number): string[] {
  const dir = path.join(os.tmpdir(), `po-upload-${Date.now()}`);
  fs.mkdirSync(dir, { recursive: true });
  return Array.from({ length: n }, (_, i) => {
    const p = path.join(dir, `bg-upload-${i + 1}.pdf`);
    fs.writeFileSync(
      p,
      Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(250 * 1024, i + 1)]),
    );
    return p;
  });
}

test("tải một lô tệp rồi sang trang khác: job chạy tiếp và tiến độ đi theo", async ({
  page,
}) => {
  test.setTimeout(180_000);

  await page.goto("/login");
  await page.getByLabel("Email").fill(SA.email);
  await page.getByLabel("Mật khẩu").fill(SA.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const auth = await page.request.post("/api/auth/login", { data: SA });
  const { accessToken } = await auth.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const list = await (
    await page.request.get("/api/purchase-orders?limit=20", { headers })
  ).json();
  const po = (list.items ?? list.data)[0];

  await page.goto(`/po/${po.id}/documents`);
  await page.getByRole("button", { name: "+ Tải tài liệu lên" }).click();

  const files = makeFiles(FILE_COUNT);
  await page.locator('input[type="file"]').setInputFiles(files);
  await page
    .getByRole("button", { name: new RegExp(`Tải lên ${FILE_COUNT} tệp`) })
    .click();

  // Modal đóng ngay, không giam người dùng lại chờ.
  await expect(
    page.getByRole("heading", { name: "Tải tài liệu lên đơn hàng PO" }),
  ).toHaveCount(0);

  const widget = page.getByText(/Đang tải lên \d+\/8/);
  await expect(widget).toBeVisible({ timeout: 10_000 });

  // Sang trang khác giữa chừng — đúng thao tác thật của người dùng.
  await page.getByRole("link", { name: /Purchase Orders/ }).first().click();
  await expect(page).toHaveURL(/\/po$/);

  // Tiến độ phải đi theo sang trang mới.
  await expect(widget).toBeVisible();

  // Và chạy tới hết.
  await expect(widget).toHaveCount(0, { timeout: 120_000 });

  const after = await (
    await page.request.get(`/api/purchase-orders/${po.id}/documents?limit=100`, {
      headers,
    })
  ).json();

  // Đếm theo tên tệp của chính test, không lấy hiệu tổng: người khác có thể
  // đang tải lên cùng PO trong lúc test chạy.
  const names = new Set(files.map((f) => path.basename(f)));
  const mine = after.items.filter((d: { fileName: string }) =>
    names.has(d.fileName),
  );
  expect(mine).toHaveLength(FILE_COUNT);
  for (const d of after.items) {
    if (names.has(d.fileName)) {
      await page.request.delete(
        `/api/purchase-orders/${po.id}/documents/${d.documentId}`,
        { headers },
      );
    }
  }
  for (const f of files) fs.rmSync(f, { force: true });
});
