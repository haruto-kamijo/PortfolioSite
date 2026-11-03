// e2e/catalog.spec.ts
import { expect, test, type Page } from "@playwright/test";

/** デザインカタログ：見本のページの操作、パーツと図鑑の行き来、スマホでの表示 */

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

/**
 * パーツの名前を見るモードに切り替える（既定はページを操作するモード）。
 * このモードでは見本の中身が inert で、指す・押すは枠が受け取るので、見本の中の要素には force で位置だけを使って操作する
 */
const showPartNames = async (page: Page, name = "パーツの名前を見る") => {
    await page.getByRole("button", { name }).click();
    await expect(stage(page)).toHaveAttribute("data-mode", "parts");
};

test.describe("ページを操作するモード", () => {
    test("既定はこのモードで、パーツを押しても図鑑へ移らない", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        await expect(stage(page)).toHaveAttribute("data-mode", "page");
        await expect(page.getByRole("button", { name: "ページを操作する" })).toHaveAttribute("aria-pressed", "true");
        await stage(page).locator('[data-part="pricing-table"]').click({ position: { x: 10, y: 10 }, force: true });
        await stage(page).locator('[data-part="feature-grid"]').hover({ force: true });
        await expect(label(page)).toHaveCount(0);
        expect(pathOf(page)).toBe("/catalog/saas");
    });

    test("アコーディオンが開け閉めでき、ナビとボタンはページの中の場所へ動く", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        const item = stage(page).locator('[data-part="accordion"] details').nth(1);
        await expect(item).not.toHaveAttribute("open");
        await item.locator("summary").click();
        await expect(item).toHaveAttribute("open", "");

        await stage(page).locator('[data-part="global-nav"]').getByRole("button", { name: "導入事例" }).click();
        await expect(stage(page).locator('[data-part="testimonial"]')).toBeInViewport();
        await stage(page).locator('[data-part="cta-button"]').getByRole("button").click();
        await expect(stage(page).locator('[data-part="pricing-table"]')).toBeInViewport();
        expect(pathOf(page)).toBe("/catalog/saas");
    });

    test("絞り込みで最初のカードが隠れていても、CTA ボタンは見えているカードへ動く", async ({ page }) => {
        await openConcept(page, "/catalog/magazine");
        await stage(page).locator('[data-part="tabs"]').getByRole("button", { name: "特集" }).click();
        const cards = stage(page).locator('[data-part="card"]');
        await expect(cards.first()).toBeHidden();
        await stage(page).locator('[data-part="cta-button"]').getByRole("button").click();
        await expect(cards.filter({ visible: true })).toBeFocused();
    });

    test("タブで中身が絞り込まれ、絞り込まれたパーツは囲まない", async ({ page }) => {
        await openConcept(page, "/catalog/studio");
        const figures = stage(page).locator('[data-part="gallery"] figure');
        await expect(figures.filter({ visible: true })).toHaveCount(6);
        await stage(page).locator('[data-part="tabs"]').getByRole("button", { name: "人物" }).click();
        await expect(figures.filter({ visible: true })).toHaveCount(2);
        // 横の一覧でタグを指すと、見えているタグだけを囲む
        await partsList(page).getByRole("link", { name: "タグ", exact: true }).hover();
        await expect(boxes(page)).toHaveCount(2);
    });

    test("フォームは入力して送信でき、どこにも送らずに知らせだけが出る", async ({ page }) => {
        await openConcept(page, "/catalog/studio");
        const form = stage(page).locator('[data-part="form"]');
        await form.getByLabel("お名前").fill("霞 太郎");
        await form.getByLabel("メール").fill("taro@example.com");
        await form.getByLabel("ご相談の内容").fill("撮影の相談です");
        await form.getByRole("button", { name: "送信" }).click();
        await expect(form.getByRole("status")).toContainText("どこにも送っていません");
        expect(pathOf(page)).toBe("/catalog/studio");
    });

    test("ページ送りで今のページが変わる", async ({ page }) => {
        await openConcept(page, "/catalog/magazine");
        const pager = stage(page).locator('[data-part="pagination"]');
        await expect(pager.locator('[aria-current="page"]')).toHaveText("2");
        await pager.getByRole("button", { name: "次のページ" }).click();
        await expect(pager.locator('[aria-current="page"]')).toHaveText("3");
        await pager.getByRole("button", { name: "12" }).click();
        await expect(pager.getByRole("button", { name: "次のページ" })).toBeDisabled();
    });
});

test.describe("PC", () => {
    test("名前を見るモードでは、キーボードでも見本の中の部品に入れない", async ({ page }) => {
        await openConcept(page, "/catalog/studio");
        await showPartNames(page);
        const focusInStage = () => stage(page).evaluate((el) => el.contains(document.activeElement));
        // 切り替えのボタンから Tab で進むと、見本を飛ばして横の一覧へ移る
        await page.keyboard.press("Tab");
        await expect(partsList(page).getByRole("link").first()).toBeFocused();
        expect(await focusInStage()).toBe(false);
        // 逆向きに戻っても、見本の中には入らない
        await page.keyboard.press("Shift+Tab");
        await expect(page.getByRole("button", { name: "パーツの名前を見る" })).toBeFocused();
    });

    test("名前を見るモードで押すと図鑑へ移り、戻っても名前を見るモードのまま", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        await showPartNames(page);
        expect(pathOf(page)).toBe("/catalog/saas?view=parts");
        await stage(page).locator('[data-part="accordion"] summary').nth(1).click({ force: true });
        await expect.poll(() => pathOf(page)).toBe("/catalog/parts#accordion");
        await page.goBack();
        await expect(stage(page)).toHaveAttribute("data-ready", "");
        await expect(stage(page)).toHaveAttribute("data-mode", "parts");
    });

    test("ページを操作するモードに戻すと、URL の見方と ?part= の囲みが外れる", async ({ page }) => {
        await openConcept(page, "/catalog/kissa?part=menu-list");
        await expect(stage(page)).toHaveAttribute("data-mode", "parts");
        await page.getByRole("button", { name: "ページを操作する" }).click();
        await page.mouse.move(1, 1);
        await expect(boxes(page)).toHaveCount(0);
        expect(pathOf(page)).toBe("/catalog/kissa");
    });

    test("パーツを指すと名前が出て、入れ子のパーツは内側の名前が出る", async ({ page }) => {
        await openConcept(page, "/catalog/kissa");
        await showPartNames(page);
        await stage(page).locator('[data-part="feature-grid"]').hover({ force: true });
        await expect(label(page)).toContainText("特徴グリッド");
        // force では重なりを確かめないので、上の固定ヘッダーの下に入らないよう、先に真ん中まで動かす
        const cta = stage(page).locator('[data-part="cta-button"]').first();
        await cta.evaluate((el) => el.scrollIntoView({ block: "center" }));
        await cta.hover({ force: true });
        await expect(label(page)).toContainText("CTA ボタン");
    });

    test("パーツを押すと図鑑のその項目に移り、項目が強調される", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        await showPartNames(page);
        await stage(page).locator('[data-part="pricing-table"]').click({ position: { x: 10, y: 10 }, force: true });
        await expect.poll(() => pathOf(page)).toBe("/catalog/parts#pricing-table");
        await expect(page.locator("#pricing-table")).toHaveAttribute("data-highlight", "");
        await expect(page.locator("#pricing-table")).toBeInViewport();
    });

    test("図鑑の「ページで見る」で見本に戻り、そのパーツが囲まれる", async ({ page }) => {
        await page.goto("/catalog/parts#menu-list");
        await page.locator("#menu-list").getByRole("link", { name: /ページで見る/ }).first().click();
        await expect.poll(() => pathOf(page)).toBe("/catalog/kissa?part=menu-list");
        await expect(stage(page)).toHaveAttribute("data-ready", "");
        // 図鑑から来たときは、名前を見るモードで開く
        await expect(stage(page)).toHaveAttribute("data-mode", "parts");
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
        await showPartNames(page, "Show part names");
        await stage(page).locator('[data-part="feature-grid"]').hover({ force: true });
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
        await page.getByRole("button", { name: "パーツの名前を見る" }).tap();
        await expect(stage(page)).toHaveAttribute("data-mode", "parts");
        const part = stage(page).locator('[data-part="pricing-table"]');
        await part.scrollIntoViewIfNeeded();
        await part.tap({ position: { x: 20, y: 20 }, force: true });
        await expect(label(page)).toContainText("料金表");
        expect(pathOf(page)).toBe("/catalog/saas?view=parts");
        // 名前のラベルが見本の枠の外で切れていない
        const l = await label(page).boundingBox();
        const s = await stage(page).boundingBox();
        expect(l!.x).toBeGreaterThanOrEqual(s!.x);
        expect(l!.x + l!.width).toBeLessThanOrEqual(s!.x + s!.width + 1);
        await part.tap({ position: { x: 20, y: 20 }, force: true });
        await expect.poll(() => pathOf(page)).toBe("/catalog/parts#pricing-table");
    });

    test("名前を見るモードでは、タップしても入力欄に入らず、アコーディオンも開かない", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        await page.getByRole("button", { name: "パーツの名前を見る" }).tap();
        const input = stage(page).locator('[data-part="newsletter"] input');
        await input.scrollIntoViewIfNeeded();
        // 中身は inert で、タップは枠が受け取る。force で、見本の上の位置をそのままタップする
        await input.tap({ force: true });
        await expect(label(page)).toContainText("ニュースレター");
        await expect(input).not.toBeFocused();
        const item = stage(page).locator('[data-part="accordion"] details').nth(1);
        await item.locator("summary").tap({ force: true });
        await expect(label(page)).toContainText("アコーディオン");
        await expect(item).not.toHaveAttribute("open");
    });

    test("雑誌のページ送りは、真ん中のページでも狭い画面からはみ出さない", async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 780 });
        await openConcept(page, "/catalog/magazine");
        const pager = stage(page).locator('[data-part="pagination"]');
        for (let i = 0; i < 3; i++) await pager.getByRole("button", { name: "次のページ" }).tap();
        await expect(pager.locator('[aria-current="page"]')).toHaveText("5");
        const next = await pager.getByRole("button", { name: "次のページ" }).boundingBox();
        const s = await stage(page).boundingBox();
        expect(next!.x + next!.width).toBeLessThanOrEqual(s!.x + s!.width);
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
