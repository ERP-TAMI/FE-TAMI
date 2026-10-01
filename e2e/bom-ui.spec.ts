import { expect, test, type Page } from "@playwright/test";

type BomSummary = { id: string; status: string; type: string };

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("123456");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function findBom(page: Page, status: string, type: string): Promise<BomSummary> {
  const accessToken = await page.evaluate(
    () => JSON.parse(localStorage.getItem("tami_session") || "{}").accessToken as string,
  );
  const response = await page.request.get("/api/boms?limit=100", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { data: BomSummary[] };
  const bom = body.data.find((item) => item.status === status && item.type === type);
  expect(bom, `Expected a seeded ${type} NPL at ${status}`).toBeDefined();
  return bom!;
}

test.describe("NPL UI in a real browser", () => {
  test("R&D can edit incrementally, add materials and open line history", async ({ page }) => {
    await login(page, "rd@tami.test");
    await page.goto("/bom");
    await expect(page.getByRole("heading", { name: /Quản lý Nguyên phụ liệu/i })).toBeVisible();
    const bom = await findBom(page, "wait_rd", "fit");
    await page.goto(`/bom/${bom.id}`);
    await expect(page.getByText("Chỉnh sửa hoặc thêm vật tư rồi bấm Lưu")).toBeVisible();
    await expect(page.getByRole("button", { name: "Chuyển TPKH" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lịch sử phiên bản 1" })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath("rd-detail.png"), fullPage: true });

    await page.getByRole("button", { name: "Chỉnh sửa" }).click();
    await expect(page.getByRole("button", { name: "Thêm vật tư" })).toBeVisible();
    await page.getByRole("button", { name: "Thêm vật tư" }).click();
    await expect(page.getByRole("heading", { name: "Thêm vật tư" })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath("rd-add-material.png"), fullPage: true });
    await page.getByRole("dialog").getByTitle("Đóng").click();
    await page.getByRole("button", { name: "Sửa thông tin" }).click();
    await expect(
      page.getByRole("heading", { name: "Chỉnh sửa thông tin NPL", exact: true }),
    ).toBeVisible();
    await page.getByPlaceholder("Nhập ghi chú kỹ thuật của bộ phận R&D...").fill("Kiểm tra nháp");
    await page.locator("[data-modal-backdrop='true']").click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole("button", { name: "Bỏ thay đổi" })).toBeVisible();
    await page.getByRole("button", { name: "Bỏ thay đổi" }).click();
    await page.getByRole("button", { name: "Lịch sử phiên bản 1" }).click();
    await expect(page.getByText("Lịch sử sửa đổi phiên bản 1")).toBeVisible();
    await page.screenshot({ path: test.info().outputPath("rd-history.png"), fullPage: true });
  });

  test("Accounting can enter prices separately and inspect line history", async ({ page }) => {
    await login(page, "accounting@tami.test");
    const bom = await findBom(page, "wait_accounting", "po");
    await page.goto(`/bom/${bom.id}`);
    await expect(page.getByText("Nhập đơn giá rồi bấm Lưu")).toBeVisible();
    await expect(page.getByRole("button", { name: "Chuyển SA" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lịch sử phiên bản 1" })).toBeVisible();
    await expect(page.locator('[data-testid^="unit-cost-input-"]').first()).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath("accounting-detail.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Lịch sử phiên bản 1" }).click();
    await expect(page.getByText("Lịch sử sửa đổi phiên bản 1")).toBeVisible();
    await page.screenshot({
      path: test.info().outputPath("accounting-history.png"),
      fullPage: true,
    });
  });

  test("TPKH has the NVKH handoff action and create dialog dismisses on backdrop", async ({
    page,
  }) => {
    await login(page, "tpkh@tami.test");
    await page.goto("/bom");
    await expect(page.getByRole("button", { name: /Tạo NPL/i })).toBeVisible();
    await page.getByRole("button", { name: /Tạo NPL/i }).click();
    await page.screenshot({ path: test.info().outputPath("create-wizard.png"), fullPage: true });
    await page.getByRole("button", { name: "Tiếp tục" }).click();
    await page.getByRole("button", { name: "Mở danh sách PO" }).click();
    await expect(page.getByRole("option").first()).toBeVisible();
    await page
      .getByRole("checkbox", { name: /^Chọn PO / })
      .nth(0)
      .check();
    await page
      .getByRole("checkbox", { name: /^Chọn PO / })
      .nth(1)
      .check();
    await expect(page.getByText("Đã chọn (2)")).toBeVisible();
    await page.getByRole("button", { name: "Đóng danh sách PO" }).click();
    await expect(page.getByRole("option")).toHaveCount(0);
    await page.getByRole("textbox", { name: "-- Chọn Đơn hàng PO --" }).click();
    await expect(page.getByRole("option").first()).toBeVisible();
    await page.getByRole("textbox", { name: "-- Chọn Đơn hàng PO --" }).click();
    await expect(page.getByRole("option")).toHaveCount(0);
    await page.locator("[data-modal-backdrop='true']").click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole("button", { name: "Bỏ thay đổi" })).toBeVisible();
    await page.getByRole("button", { name: "Bỏ thay đổi" }).click();
    const bom = await findBom(page, "wait_nvkh", "po");
    await page.goto(`/bom/${bom.id}`);
    await expect(page.getByRole("button", { name: "Chuyển RD" })).toBeVisible();
  });

  test("a promoted old revision keeps its own audit; NPL changes live in the history tab", async ({
    page,
  }) => {
    await login(page, "sa@tami.test");
    const token = await page.evaluate(
      () => JSON.parse(localStorage.getItem("tami_session") || "{}").accessToken as string,
    );
    const headers = { Authorization: `Bearer ${token}` };
    const list = (await (await page.request.get("/api/boms?limit=100", { headers })).json()) as {
      data: BomSummary[];
    };
    let chosen: { id: string; revisionNo: number; ownReason: string; otherReason: string } | null =
      null;
    for (const bom of list.data.filter((item) => item.type === "fit")) {
      const revisions = (await (
        await page.request.get(`/api/boms/${bom.id}/revisions`, { headers })
      ).json()) as { id: string; revisionNo: number; isCurrent: boolean }[];
      const current = revisions.find((revision) => revision.isCurrent);
      const newer = revisions.find((revision) => revision.revisionNo > (current?.revisionNo ?? 0));
      if (!current || !newer) continue;
      const own = (await (
        await page.request.get(
          `/api/audit/history?aggregateType=BomRevision&parentId=${current.id}`,
          { headers },
        )
      ).json()) as { items: { reason: string }[] };
      const other = (await (
        await page.request.get(
          `/api/audit/history?aggregateType=BomRevision&parentId=${newer.id}`,
          { headers },
        )
      ).json()) as { items: { reason: string }[] };
      if (own.items.length && other.items.length) {
        chosen = {
          id: bom.id,
          revisionNo: current.revisionNo,
          ownReason: own.items[0].reason,
          otherReason: other.items[0].reason,
        };
        break;
      }
    }
    expect(chosen, "Expected a restored older Fit revision with audit data").not.toBeNull();
    await page.goto(`/bom/${chosen!.id}`);
    await page.getByRole("button", { name: `Lịch sử phiên bản ${chosen!.revisionNo}` }).click();
    await expect(page.getByText(chosen!.ownReason, { exact: true })).toBeVisible();
    await expect(page.getByText(chosen!.otherReason, { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Đóng hộp thoại" }).click();
    await page.getByRole("button", { name: "Lịch sử", exact: true }).click();
    await expect(page.getByRole("button", { name: "Lịch sử NPL" })).toBeVisible();
    await page.getByRole("button", { name: "Lịch sử NPL" }).click();
    await expect(page.getByText(/Đổi phiên bản hiện hành về phiên bản/)).toBeVisible();
    await expect(page.getByText(chosen!.ownReason, { exact: true })).toBeVisible();
    await expect(page.getByText(chosen!.otherReason, { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog").getByText(/Phiên bản 1/).first()).toBeVisible();
    await expect(page.getByRole("dialog").getByText(/Phiên bản 2/).first()).toBeVisible();
    await page.screenshot({ path: test.info().outputPath("promoted-revision-audit.png") });
  });
});
