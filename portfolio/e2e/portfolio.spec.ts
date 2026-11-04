// e2e/portfolio.spec.ts
import { Page, expect, test } from "@playwright/test";

/**
 * 制作物（/portfolio）のタグでの絞り込み。
 * E2E では Firestore も RSS も無いので、作品はコードに置いたデザインカタログのカード1枚だけになる
 * （タグは Next.js・Tailwind CSS・TypeScript）。複数の作品での絞り込みの決まりは src/lib/content/tags.test.ts で確かめる
 */

const urlOf = (page: Page) => {
    const u = new URL(page.url());
    return `${u.pathname}${u.search}`;
};

const tagList = (page: Page) => page.getByRole("region", { name: "タグで探す" });
const tabs = (page: Page) => page.getByRole("navigation", { name: "カテゴリ" });
const cards = (page: Page) => page.locator("main ul.grid > li");

test("タグの列から選ぶと、すべてのカテゴリからそのタグの作品に絞り込み、結果の件数へ動く", async ({ page }) => {
    await page.goto("/portfolio");
    // 名前は、見た目の文字（タグと件数）で始まる
    await expect(tagList(page).getByRole("link", { name: "TypeScript 1 件。押すと絞り込む" })).toBeVisible();

    await tagList(page).getByRole("link", { name: /^Next\.js 1/ }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tag=Next.js");
    const results = page.getByText("「Next.js」のタグが付いた作品：1 件", { exact: true });
    await expect(results).toBeVisible();
    await expect(results).toBeFocused();
    // 絞り込み中はどのタブも選ばれておらず、カードにはどのカテゴリの作品かが出る
    await expect(tabs(page).locator('[aria-current="page"]')).toHaveCount(0);
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText("Webサイト");
});

test("キーボードで選んでも、フォーカスは結果の件数に移る", async ({ page }) => {
    await page.goto("/portfolio");
    await tagList(page).getByRole("link", { name: /^TypeScript 1/ }).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tag=TypeScript");
    await expect(page.locator("#tag-results")).toBeFocused();
});

test("2つ目のタグを足せ、選んだタグを押すと外れる", async ({ page }) => {
    await page.goto("/portfolio?tag=Next.js");
    await tagList(page).getByRole("link", { name: /^TypeScript 1/ }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tag=Next.js&tag=TypeScript");
    await expect(page.getByText("「Next.js」「TypeScript」のタグが付いた作品：1 件", { exact: true })).toBeVisible();
    // 選んだタグは足す側の列から消える
    await expect(tagList(page).getByRole("link", { name: /^TypeScript 1/ })).toHaveCount(0);

    await tagList(page).getByRole("link", { name: "Next.js （選択中。押すと外す）" }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tag=TypeScript");
    // 一部を外して、まだタグが残っているときも、結果の件数へ動く
    await expect(page.getByText("「TypeScript」のタグが付いた作品：1 件", { exact: true })).toBeFocused();
});

test("カードのタグを押しても絞り込め、開いていたタブは解除したときに戻る", async ({ page }) => {
    await page.goto("/portfolio?tab=sites");
    const card = cards(page).first();
    await card.getByRole("link", { name: /^Tailwind CSS ?。押すと絞り込む$/ }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tab=sites&tag=Tailwind+CSS");
    await expect(page.getByText("「Tailwind CSS」のタグが付いた作品：1 件", { exact: true })).toBeVisible();
    // 選んでいるタグは、カードの中でも押すと外れる
    await card.getByRole("link", { name: /^Tailwind CSS ?（選択中。押すと外す）$/ }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tab=sites");
    await expect(tabs(page).getByRole("link", { name: "Webサイト" })).toHaveAttribute("aria-current", "page");
});

test("タブを押すと絞り込みが外れ、解除のリンクでも絞り込む前のタブに戻る", async ({ page }) => {
    await page.goto("/portfolio?tag=Next.js");
    await tabs(page).getByRole("link", { name: "ゲーム" }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tab=games");
    await expect(tabs(page).getByRole("link", { name: "ゲーム" })).toHaveAttribute("aria-current", "page");

    await page.goto("/portfolio?tab=games&tag=Next.js");
    await tagList(page).getByRole("link", { name: "絞り込みを解除" }).click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio?tab=games");
    await expect(tabs(page).getByRole("link", { name: "ゲーム" })).toHaveAttribute("aria-current", "page");
});

test("URL のタグは大文字・小文字を区別せず、作品の書き方で出す", async ({ page }) => {
    await page.goto("/portfolio?tag=next.js");
    await expect(page.getByText("「Next.js」のタグが付いた作品：1 件", { exact: true })).toBeVisible();
});

test("どの作品にも無いタグの組み合わせは、その旨と解除のリンクを出す", async ({ page }) => {
    await page.goto("/portfolio?tag=Next.js&tag=no-such-tag");
    await expect(page.getByText("選んだタグがすべて付いた作品はありません")).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await page.getByRole("main").getByRole("link", { name: "絞り込みを解除" }).last().click();
    await expect.poll(() => urlOf(page)).toBe("/portfolio");
});

test("選べる数（5個）まで選ぶと、その旨を出す", async ({ page }) => {
    await page.goto("/portfolio?tag=a&tag=b&tag=c&tag=d&tag=e&tag=f");
    await expect(page.getByText("タグは 5 個まで選べます")).toBeVisible();
    // 6個目は読まない
    await expect(tagList(page).getByRole("link", { name: /選択中/ })).toHaveCount(5);
});

test("URL に書いたタグの記号で、文面が崩れない", async ({ page }) => {
    await page.goto(`/portfolio?tag=${encodeURIComponent("{n}$'")}`);
    await expect(page.getByText("「{n}$'」のタグが付いた作品：0 件", { exact: true })).toBeVisible();
});

test("英語のページでは、英語のまま絞り込み、解除しても英語のまま", async ({ page }) => {
    await page.goto("/en/portfolio");
    await page.getByRole("region", { name: "Filter by tag" }).getByRole("link", { name: /^Next\.js 1 works/ }).click();
    await expect.poll(() => urlOf(page)).toBe("/en/portfolio?tag=Next.js");
    await expect(page.getByText("Works with all of the selected tags (Next.js): 1", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Clear filter" }).click();
    await expect.poll(() => urlOf(page)).toBe("/en/portfolio");
});
