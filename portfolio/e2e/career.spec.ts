// e2e/career.spec.ts
import { expect, test, type Page } from "@playwright/test";

/**
 * 経歴のページ（/career）。
 * E2E では Firestore に繋がないので、例の登録ファイル（scripts/career.example.json）を読んで年表を出す（CAREER_EXAMPLE_FILE）
 */

const filters = (page: Page) => page.getByRole("group", { name: "種類で絞り込む" });
const items = (page: Page) => page.locator("main ol > li");

test("ヘッダーから開け、年ごとに新しい順で並ぶ", async ({ page }) => {
    await page.goto("/home");
    await page.locator("header").first().getByRole("link", { name: "経歴" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/career");
    await expect(page.locator("header").first().locator('a[aria-current="page"]')).toHaveText("経歴");
    await expect(page.getByRole("heading", { level: 1, name: "経歴" })).toBeVisible();

    const years = await page.getByRole("heading", { level: 2 }).allTextContents();
    expect(years).toEqual(["2026", "2025", "2023", "2022"]);
    // 同じ年の中も新しい順（2025年11月 → 8月 → 4月）
    const in2025 = page.getByRole("region", { name: "2025" }).getByRole("heading", { level: 3 });
    await expect(in2025).toHaveText([/ハッカソン/, /インターン/, /研究室/]);
    await expect(page.getByText("2022年4月 〜 現在")).toBeVisible();
});

test("種類で絞り込め、すべてに戻せる", async ({ page }) => {
    await page.goto("/career");
    await expect(items(page)).toHaveCount(6);
    await filters(page).getByRole("button", { name: "職歴・資格" }).click();
    await expect(filters(page).getByRole("button", { name: "職歴・資格" })).toHaveAttribute("aria-pressed", "true");
    await expect(items(page)).toHaveCount(2);
    await expect(page.locator('main ol > li:not([data-kind="work"])')).toHaveCount(0);
    // 項目の無くなった年は見出しごと消える
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(["2025", "2023"]);
    await filters(page).getByRole("button", { name: "すべて" }).click();
    await expect(items(page)).toHaveCount(6);
});

test("サイトの中のリンクは同じタブで、外のリンクは別のタブで開く", async ({ page }) => {
    await page.goto("/career");
    await expect(page.getByRole("link", { name: /予稿/ })).toHaveAttribute("target", "_blank");
    await page.getByRole("link", { name: /作品/ }).click();
    await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).search).toBe("/portfolio?tag=Next.js");
});

test("英語のページでは英語で出し、サイトの中のリンクも英語のページへ", async ({ page }) => {
    await page.goto("/en/career");
    await expect(page.getByRole("heading", { level: 1, name: "CAREER" })).toBeVisible();
    await expect(page.getByText("Apr 2022 〜 Present")).toBeVisible();
    await expect(page.getByRole("group", { name: "Filter by type" }).getByRole("button", { name: "Education" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Project/ })).toHaveAttribute("href", "/en/portfolio?tag=Next.js");
});
