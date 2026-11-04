// e2e/portfolio.spec.ts
import { Page, expect, test } from "@playwright/test";

/**
 * 制作物（/portfolio）のタグでの絞り込み。
 * E2E では Firestore も RSS も無いので、作品はコードに置いたデザインカタログのカード1枚だけになる
 * （タグは Next.js・Tailwind CSS・TypeScript）
 */

const urlOf = (page: Page) => {
    const u = new URL(page.url());
    return `${u.pathname}${u.search}`;
};

const tagList = (page: Page) => page.getByRole("region", { name: "タグで探す" });
const tabs = (page: Page) => page.getByRole("navigation", { name: "カテゴリ" });
const cards = (page: Page) => page.locator("main ul.grid > li");

test("タグの列から選ぶと、すべてのカテゴリからそのタグの作品に絞り込む", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(tagList(page).getByRole("link", { name: "TypeScript で絞り込む (1)" })).toBeVisible();

    await tagList(page).getByRole("link", { name: /^Next\.js で絞り込む/ }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tag=Next.js");
    await expect(page.getByText("「Next.js」のタグが付いた作品：1 件")).toBeVisible();
    // 絞り込み中はどのタブも選ばれておらず、カードにはどのカテゴリの作品かが出る
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveCount(0);
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("Webサイト");
});

test("2つ目のタグを足すと両方を持つ作品に絞り、選んだタグを押すと外れる", async ({ page }) => {
    await page.goto("/portfolio?tag=Next.js");
    await tagList(page).getByRole("link", { name: /^TypeScript で絞り込む/ }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tag=Next.js&tag=TypeScript");
    await expect(page.getByText("「Next.js」「TypeScript」のタグが付いた作品：1 件")).toBeVisible();
    // 選んだタグは足す側の列から消える
    await expect(tagList(page).getByRole("link", { name: /^TypeScript で絞り込む/ })).toHaveCount(0);

    await tagList(page).getByRole("link", { name: "Next.js の絞り込みを外す" }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tag=TypeScript");
});

test("カードのタグを押しても絞り込め、カードのリンクとは別に動く", async ({ page }) => {
    await page.goto("/portfolio?tab=sites");
    const card = cards(page).first();
    await card.getByRole("link", { name: "Tailwind CSS で絞り込む" }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tag=Tailwind+CSS");
    await expect(page.getByText("「Tailwind CSS」のタグが付いた作品：1 件")).toBeVisible();
    // 選んでいるタグはカードの中でも押すと外れる
    await expect(card.getByRole("link", { name: "Tailwind CSS の絞り込みを外す" })).toHaveAttribute("aria-current", "true");
    await card.getByRole("link", { name: "Tailwind CSS の絞り込みを外す" }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio");
});

test("タブを押すと絞り込みが外れ、解除のリンクでも元に戻る", async ({ page }) => {
    await page.goto("/portfolio?tag=Next.js");
    await tabs(page).getByRole("link", { name: "ゲーム" }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tab=games");
    await expect(tabs(page).getByRole("link", { name: "ゲーム" })).toHaveAttribute("aria-current", "page");

    await page.goto("/portfolio?tag=Next.js");
    await page.getByRole("link", { name: "絞り込みを解除" }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio");
    await expect(tabs(page).getByRole("link", { name: "Webサイト" })).toHaveAttribute("aria-current", "page");
});

test("どの作品にも無いタグの組み合わせは、その旨と解除のリンクを出す", async ({ page }) => {
    await page.goto("/portfolio?tag=Next.js&tag=no-such-tag");
    await expect(page.getByText("このタグの組み合わせの作品はありません")).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await page.getByRole("main").getByRole("link", { name: "絞り込みを解除" }).last().click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio");
});

test("英語のページでは、英語のまま絞り込む", async ({ page }) => {
    await page.goto("/en/portfolio");
    await page.getByRole("region", { name: "Filter by tag" }).getByRole("link", { name: /^Filter by Next\.js/ }).click();
    await expect.poll(() => urlOf(page)).toBe("/en/portfolio?tag=Next.js");
    await expect(page.getByText("Works tagged Next.js: 1")).toBeVisible();
});
