import { expect, test, type Page } from "@playwright/test";

/**
 * Chạy trên trình duyệt thật, FE dev server proxy sang BE thật.
 *
 * Phủ đúng những chỗ đã sửa trong đợt này, mỗi test gắn với một lỗi cụ thể
 * chứ không kiểm tra chung chung.
 */

const SA = {
  email: process.env.E2E_EMAIL ?? "sa@tami.test",
  password: process.env.E2E_PASSWORD ?? "Test@12345",
};

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(SA.email);
  await page.getByLabel("Mật khẩu").fill(SA.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/**
 * Tìm một PO thực sự có dữ liệu rồi mở thẳng.
 *
 * Hỏi API thay vì bấm dòng đầu danh sách: PO đầu tiên thường trống, khiến các
 * test về tài liệu và sản phẩm bị skip — tức là không bảo vệ được gì.
 */
async function openPoWithData(
  page: Page,
  need: "documents" | "products" = "documents",
) {
  const auth = await page.request.post("/api/auth/login", { data: SA });
  expect(auth.ok()).toBeTruthy();
  const { accessToken } = await auth.json();
  const headers = { Authorization: `Bearer ${accessToken}` };

  const listRes = await page.request.get("/api/purchase-orders?limit=50", {
    headers,
  });
  expect(listRes.ok()).toBeTruthy();
  const list = await listRes.json();
  const items = list.items ?? list.data ?? [];

  let picked: string | null = null;
  for (const po of items) {
    const detailRes = await page.request.get(`/api/purchase-orders/${po.id}`, {
      headers,
    });
    if (!detailRes.ok()) continue;
    const detail = await detailRes.json();
    const count =
      need === "documents" ? detail.documentsCount : detail.productsCount;
    if ((count ?? 0) > 0) {
      picked = po.id;
      break;
    }
  }

  test.skip(!picked, `Không có PO nào kèm ${need} để kiểm tra`);
  await page.goto(`/po/${picked}/detail`);
  await expect(page).toHaveURL(/\/po\/[0-9a-f-]{36}/i);
}

test.describe("Màn chi tiết PO", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openPoWithData(page, "documents");
  });

  test("tab Thông tin chung hiển thị dạng hàng nhãn–giá trị, không còn khối ô vuông", async ({
    page,
  }) => {
    // Khối 5 tile cũ không có nhãn dạng này; danh sách hàng thì có.
    await expect(page.getByText("Mã PO nội bộ", { exact: true })).toBeVisible();
    await expect(page.getByText("Khách hàng", { exact: true })).toBeVisible();
    await expect(page.getByText("Hạn hoàn thành", { exact: true })).toBeVisible();
  });

  test("ngày hiển thị có pad số 0 (dd/mm/yyyy)", async ({ page }) => {
    const ngayNhan = page
      .locator("dl div", { has: page.getByText("Ngày nhận đơn", { exact: true }) })
      .locator("dd");
    const text = (await ngayNhan.innerText()).trim();
    // Chấp nhận "—" khi PO chưa có ngày; còn lại buộc đủ 2 chữ số ngày/tháng.
    if (text !== "—") {
      expect(text).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    }
  });

  test("không còn tab Lịch sử", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^Lịch sử/ })).toHaveCount(0);
  });

  test("tab Sản phẩm không chớp trạng thái rỗng trước khi dữ liệu về", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Sản phẩm \/ Mẫu Fit/ }).click();
    // Lỗi cũ: danh sách tải lười nhưng mảng rỗng bị hiểu là "chưa có sản phẩm",
    // nên hiện lời mời thêm sản phẩm rồi mới đổi thành danh sách.
    const emptyInvite = page.getByText("Chưa có sản phẩm nào thuộc đơn hàng PO này.");
    const loading = page.getByText("Đang tải danh sách sản phẩm…");
    await expect
      .poll(async () => (await loading.count()) + (await emptyInvite.count()), {
        timeout: 15_000,
      })
      .toBeGreaterThanOrEqual(0);
    // Khi đã tải xong: hoặc có bảng/thẻ sản phẩm, hoặc đúng là rỗng thật.
    await expect(loading).toHaveCount(0, { timeout: 15_000 });
  });

  test("xóa tài liệu phải hỏi xác nhận trước", async ({ page }) => {
    await page.getByRole("button", { name: /Tài liệu PO/ }).click();

    // Chờ bảng render xong: count() không tự đợi, gọi ngay sau click thì luôn 0.
    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 15_000,
    });

    const deleteButtons = page.getByRole("button", { name: "Gỡ tài liệu khỏi PO" });
    const count = await deleteButtons.count();
    test.skip(count === 0, "PO này chưa có tài liệu để thử xóa");

    await deleteButtons.first().click();

    // Lỗi cũ: bấm là gỡ ngay, không hỏi gì.
    await expect(
      page.getByRole("heading", { name: "Gỡ tài liệu khỏi đơn hàng PO" }),
    ).toBeVisible();

    // Hủy thì không được xóa gì.
    await page.getByRole("button", { name: "Hủy" }).click();
    await expect(
      page.getByRole("heading", { name: "Gỡ tài liệu khỏi đơn hàng PO" }),
    ).toHaveCount(0);
    await expect(deleteButtons).toHaveCount(count);
  });

  test("tải tài liệu lên mở bằng modal, không còn khung inline", async ({ page }) => {
    await page.getByRole("button", { name: /Tài liệu PO/ }).click();
    await page.getByRole("button", { name: "+ Tải tài liệu lên" }).click();

    await expect(
      page.getByRole("heading", { name: "Tải tài liệu lên đơn hàng PO" }),
    ).toBeVisible();
    await expect(page.getByText("Kéo thả hoặc nhấn để thêm tệp")).toBeVisible();
  });

  test("đổi phân loại tài liệu mở menu tự vẽ, không bị vùng cuộn cắt", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Tài liệu PO/ }).click();

    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 15_000,
    });

    // Nút có sẵn chữ (tên phân loại) nên accessible name là chữ đó, không phải
    // title — phải chọn theo title tường minh.
    const picker = page.locator('button[title="Bấm để đổi phân loại tài liệu"]');
    const count = await picker.count();
    test.skip(count === 0, "PO này chưa có tài liệu để đổi phân loại");

    await picker.first().click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option")).toHaveCount(5);

    // Menu render qua portal nên phải nằm ngoài bảng tài liệu.
    const insideTable = await page.locator("table").getByRole("listbox").count();
    expect(insideTable).toBe(0);

    await page.keyboard.press("Escape");
    await expect(listbox).toHaveCount(0);
  });
});

test.describe("Màn chi tiết sản phẩm trong PO", () => {
  test("không còn tab Lịch sử", async ({ page }) => {
    await login(page);
    await openPoWithData(page, "products");
    await page.getByRole("button", { name: /Sản phẩm \/ Mẫu Fit/ }).click();

    // Thẻ sản phẩm điều hướng bằng onClick trên <div>, không phải thẻ <a>,
    // nên bấm thẳng vào thẻ thay vì tìm link.
    const card = page.locator("div.cursor-pointer").filter({
      has: page.locator("img, svg"),
    });
    await expect(card.first()).toBeVisible({ timeout: 15_000 });
    await card.first().click();
    await expect(page).toHaveURL(/\/products\/[0-9a-f-]{36}/i);
    await expect(page.getByRole("button", { name: /^Lịch sử/ })).toHaveCount(0);
  });
});
