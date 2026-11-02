// e2e/catalog.spec.ts
import { expect, test, type Page } from "@playwright/test";

/** デザインカタログ：見本のパーツと図鑑の行き来、スマホでの表示 */

const CONCEPTS = ["kissa", "saas", "magazine", "studio"];

const stage = (page: Page) => page.getByTestId("catalog-stage");
const label = (page: Page) => page.getByTestId("catalog-part-label");
const boxes = (page: Page) => page.getByTestId("catalog-part-box");
const partsList = (page: Page) => page.getByRole("navigation", { name: "このページのパーツ" });
const pathOf = (page: Page) => new URL(page.url()).pathname + new URL(page.url()).search + new URL(page.url()).hash;

/** 見本のページを開き、動かせるようになる（ハイドレーションが終わる）まで待つ。前に指しても React に届かないため */
const openConcept = async (page: Page, path: string) => {
    await page.goto(path);
    await expect(stage(page)).toHaveAttribute("data-ready", "");
};

test.describe("PC", () => {
    test("パーツを指すと名前が出て、入れ子のパーツは内側の名前が出る", async ({ page }) => {
        await openConcept(page, "/catalog/kissa");
        await stage(page).locator('[data-part="feature-grid"]').hover();
        await expect(label(page)).toContainText("特徴グリッド");
        await stage(page).locator('[data-part="cta-button"]').first().hover();
        await expect(label(page)).toContainText("CTA ボタン");
    });

    test("パーツを押すと図鑑のその項目に移り、項目が強調される", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        await stage(page).locator('[data-part="pricing-table"]').click({ position: { x: 10, y: 10 } });
        await expect.poll(() => pathOf(page)).toBe("/catalog/parts#pricing-table");
        await expect(page.locator("#pricing-table")).toHaveAttribute("data-highlight", "");
        await expect(page.locator("#pricing-table")).toBeInViewport();
    });

    test("図鑑の「ページで見る」で見本に戻り、そのパーツが囲まれる", async ({ page }) => {
        await page.goto("/catalog/parts#menu-list");
        await page.locator("#menu-list").getByRole("link", { name: /ページで見る/ }).first().click();
        await expect.poll(() => pathOf(page)).toBe("/catalog/kissa?part=menu-list");
        await expect(stage(page)).toHaveAttribute("data-ready", "");
        // 押した位置にカーソルが残ると、そこにあるパーツの名前が優先されるので外へ動かす
        await page.mouse.move(1, 1);
        await expect(boxes(page)).toHaveCount(1);
        await expect(label(page)).toContainText("価格リスト");
    });

    test("?part= で開いたあと、横の一覧を指して外れると元の囲みに戻る", async ({ page }) => {
        await openConcept(page, "/catalog/kissa?part=menu-list");
        await expect(label(page)).toContainText("価格リスト");
        const other = partsList(page).getByRole("link", { name: "特徴グリッド", exact: true });

        await other.hover();
        await expect(label(page)).toContainText("特徴グリッド");
        await page.mouse.move(1, 1);
        await expect(label(page)).toContainText("価格リスト");

        // キーボード（フォーカスが当たって外れる）でも同じ
        await other.focus();
        await expect(label(page)).toContainText("特徴グリッド");
        await other.blur();
        await expect(label(page)).toContainText("価格リスト");
    });

    test("同じページのまま戻る・進むで ?part= が変わると、囲みもそれに合わせる", async ({ page }) => {
        await openConcept(page, "/catalog/kissa?part=menu-list");
        await page.mouse.move(1, 1);
        await expect(boxes(page)).toHaveCount(1);
        // ?part= の無い URL を履歴に足してから戻る・進む
        await page.evaluate(() => window.history.pushState(null, "", "/catalog/kissa"));
        await page.goBack();
        await expect.poll(() => pathOf(page)).toBe("/catalog/kissa?part=menu-list");
        await expect(boxes(page)).toHaveCount(1);
        await page.goForward();
        await expect.poll(() => pathOf(page)).toBe("/catalog/kissa");
        await expect(boxes(page)).toHaveCount(0);
        // 一覧を指して外れても、古い囲みは戻ってこない
        await partsList(page).getByRole("link", { name: "特徴グリッド", exact: true }).hover();
        await page.mouse.move(1, 1);
        await expect(boxes(page)).toHaveCount(0);
    });

    test("横の一覧を指すと、ページの中の同じパーツが全部囲まれる", async ({ page }) => {
        await openConcept(page, "/catalog/magazine");
        const tags = await stage(page).locator('[data-part="tag"]').count();
        expect(tags).toBeGreaterThan(1);
        await partsList(page).getByRole("link", { name: "タグ", exact: true }).hover();
        await expect(boxes(page)).toHaveCount(tags);
    });

    test("見本のどのパーツにも、図鑑の項目がある", async ({ request }) => {
        // 見本の HTML から data-part を集め、図鑑の section の id と突き合わせる（ブラウザで4ページ開くより軽い）
        const idsOf = async (path: string, pattern: RegExp) =>
            new Set(Array.from((await (await request.get(path)).text()).matchAll(pattern), (m) => m[1]));
        const sections = await idsOf("/catalog/parts", /<section[^>]* id="([a-z-]+)"/g);
        for (const c of CONCEPTS) {
            const parts = await idsOf(`/catalog/${c}`, /data-part="([a-z-]+)"/g);
            expect(parts.size, c).toBeGreaterThan(0);
            for (const id of Array.from(parts)) expect(sections.has(id), `${c} の ${id}`).toBe(true);
        }
    });

    test("英語のページは英語の名前とタイトルになる", async ({ page }) => {
        await openConcept(page, "/en/catalog/kissa");
        await expect(page).toHaveTitle(/^Kissa Hoshizuki \(Japanese modern\) \| Design Catalog/);
        await stage(page).locator('[data-part="feature-grid"]').hover();
        await expect(label(page)).toHaveText("Feature grid");
    });

    test("制作物の Webサイト タブにカタログのカードが出て、表示中の言語のまま開く", async ({ page }) => {
        await page.goto("/portfolio?tab=sites");
        await page.getByRole("link", { name: /デザインカタログ/ }).click();
        await expect.poll(() => pathOf(page)).toBe("/catalog");
        await page.goto("/en/portfolio?tab=sites");
        await page.getByRole("link", { name: /Design Catalog/ }).click();
        await expect.poll(() => pathOf(page)).toBe("/en/catalog");
    });
});

test.describe("スマホ（タッチ）", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    for (const c of CONCEPTS) {
        test(`${c}：見本が画面の幅に収まり、横にはみ出さない`, async ({ page }) => {
            await openConcept(page, `/catalog/${c}`);
            const width = await stage(page).evaluate((el) => el.getBoundingClientRect().width);
            expect(width).toBeLessThanOrEqual(390);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        });
    }

    test("1回目のタップで名前、2回目のタップで図鑑へ", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        const part = stage(page).locator('[data-part="pricing-table"]');
        await part.scrollIntoViewIfNeeded();
        await part.tap({ position: { x: 20, y: 20 } });
        await expect(label(page)).toContainText("料金表");
        expect(pathOf(page)).toBe("/catalog/saas");
        // 名前のラベルが見本の枠の外で切れていない
        const l = await label(page).boundingBox();
        const s = await stage(page).boundingBox();
        expect(l!.x).toBeGreaterThanOrEqual(s!.x);
        expect(l!.x + l!.width).toBeLessThanOrEqual(s!.x + s!.width + 1);
        await part.tap({ position: { x: 20, y: 20 } });
        await expect.poll(() => pathOf(page)).toBe("/catalog/parts#pricing-table");
    });
});

test.describe("動きを減らす設定", () => {
    test.use({ viewport: { width: 390, height: 844 }, contextOptions: { reducedMotion: "reduce" } });

    test("ティッカーは止まり、複製を隠して横にスクロールできる", async ({ page }) => {
        await openConcept(page, "/catalog/magazine");
        const ticker = stage(page).locator('[data-part="ticker"]');
        const state = await ticker.evaluate((el) => ({
            animation: getComputedStyle(el.firstElementChild!).animationName,
            duplicate: getComputedStyle(el.querySelector("span[aria-hidden]")!).display,
            overflowX: getComputedStyle(el).overflowX,
            scrollable: el.scrollWidth > el.clientWidth,
        }));
        expect(state).toEqual({ animation: "none", duplicate: "none", overflowX: "auto", scrollable: true });
    });
});
