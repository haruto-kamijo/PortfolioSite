// e2e/catalog-width.spec.ts
import { expect, test, type Page } from "@playwright/test";

/**
 * デザインカタログの表示する幅（PC・タブレット・スマホ）と、パーツ図鑑のコードの表示。
 * 幅を選ぶと、見本だけのページ（/catalog-frame/<見本>）をその幅の iframe に入れて描く
 */

const stage = (page: Page) => page.getByTestId("catalog-stage");
const label = (page: Page) => page.getByTestId("catalog-part-label");
const boxes = (page: Page) => page.getByTestId("catalog-part-box");
const frameEl = (page: Page) => stage(page).locator("iframe");
const frame = (page: Page) => page.frameLocator('[data-testid="catalog-stage"] iframe');
const urlOf = (page: Page) => {
    const u = new URL(page.url());
    return `${u.pathname}${u.search}${u.hash}`;
};

const openConcept = async (page: Page, path: string) => {
    await page.goto(path);
    await expect(stage(page)).toHaveAttribute("data-ready", "");
};

/** iframe の中身が読み込まれ、高さが中身に合うまで待つ */
const waitForFrame = async (page: Page) => {
    await expect(frame(page).locator("[data-catalog-frame]")).toBeVisible();
    await expect.poll(async () => (await frameEl(page).boundingBox())?.height ?? 0).toBeGreaterThan(1000);
};

/** iframe の中の要素を、親のページの画面の真ん中へ動かす（固定ヘッダーの下に隠れないように） */
const centerInFrame = async (page: Page, selector: string) => {
    await frame(page).locator(selector).first().evaluate((el) => el.scrollIntoView({ block: "center" }));
};

test.describe("表示する幅（PC の画面）", () => {
    test("既定は画面に合わせる幅で、iframe を使わない", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        await expect(page.getByRole("button", { name: "画面に合わせる" })).toHaveAttribute("aria-pressed", "true");
        await expect(frameEl(page)).toHaveCount(0);
        await expect(stage(page)).toHaveAttribute("data-width", "fit");
    });

    test("スマホを選ぶと、390px の iframe で並びが変わり、URL に残る", async ({ page }) => {
        await openConcept(page, "/catalog/saas");
        await page.getByRole("button", { name: "スマホ" }).click();
        await expect.poll(() => urlOf(page)).toBe("/catalog/saas?width=phone");
        await waitForFrame(page);
        await expect(page.getByTestId("catalog-width-info")).toHaveText("390px");
        // iframe の中の画面の幅が 390px になり、特徴グリッドが1列に並ぶ
        expect(await frame(page).locator("body").evaluate(() => window.innerWidth)).toBe(390);
        const columns = await frame(page)
            .locator('[data-part="feature-grid"]')
            .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
        expect(columns).toBe(1);
        // 星空の背景は iframe の中では描かない
        await expect(frame(page).locator("canvas")).toHaveCount(0);

        // 開き直しても、同じ幅のまま
        await page.reload();
        await expect(stage(page)).toHaveAttribute("data-width", "phone");
        await waitForFrame(page);
    });

    test("枠より広い PC の幅は、縮めて全体を見せる", async ({ page }) => {
        await openConcept(page, "/catalog/saas?width=pc");
        await waitForFrame(page);
        await expect(page.getByTestId("catalog-width-info")).toHaveText(/^1280px を \d+% に縮めて表示$/);
        const outer = await stage(page).boundingBox();
        const inner = await frameEl(page).boundingBox();
        expect(inner!.width).toBeLessThanOrEqual(outer!.width + 1);
        expect(await frame(page).locator("body").evaluate(() => window.innerWidth)).toBe(1280);
        // PC の幅では特徴グリッドが3列
        const columns = await frame(page)
            .locator('[data-part="feature-grid"]')
            .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
        expect(columns).toBe(3);
    });

    test("iframe の中でも、ページを操作するモードではボタンでページの中の場所へ動く", async ({ page }) => {
        await openConcept(page, "/catalog/saas?width=phone");
        await waitForFrame(page);
        await frame(page).locator('[data-part="cta-button"]').getByRole("button").click();
        await expect(frame(page).locator('[data-part="pricing-table"]')).toBeInViewport();
        expect(urlOf(page)).toBe("/catalog/saas?width=phone");
    });

    test("iframe の中でも、パーツを指すと名前が出て、押すと図鑑へ移り、戻ると同じ幅と見方に戻る", async ({ page }) => {
        await openConcept(page, "/catalog/saas?width=phone");
        await waitForFrame(page);
        await page.getByRole("button", { name: "パーツの名前を見る" }).click();
        await expect(stage(page)).toHaveAttribute("data-mode", "parts");
        // 名前を見るモードでは、iframe の中も inert になる
        await expect(frame(page).locator("body")).toHaveAttribute("inert", "");

        await centerInFrame(page, '[data-part="feature-grid"]');
        const part = await frame(page).locator('[data-part="feature-grid"]').boundingBox();
        await page.mouse.move(part!.x + part!.width / 2, part!.y + 10);
        await expect(label(page)).toContainText("特徴グリッド");
        // 囲みは、iframe の中のパーツと同じ位置に出る
        const box = await boxes(page).first().boundingBox();
        expect(Math.abs(box!.x - part!.x)).toBeLessThan(2);
        expect(Math.abs(box!.y - part!.y)).toBeLessThan(2);
        expect(Math.abs(box!.width - part!.width)).toBeLessThan(2);

        await page.mouse.click(part!.x + part!.width / 2, part!.y + 10);
        await expect.poll(() => urlOf(page)).toBe("/catalog/parts#feature-grid");
        await page.goBack();
        await expect(stage(page)).toHaveAttribute("data-mode", "parts");
        await expect(stage(page)).toHaveAttribute("data-width", "phone");
        expect(urlOf(page)).toBe("/catalog/saas?width=phone&view=parts");
    });

    test("縮めた PC の幅でも、囲みはパーツと同じ大きさになる", async ({ page }) => {
        await openConcept(page, "/catalog/saas?width=pc&view=parts");
        await waitForFrame(page);
        await centerInFrame(page, '[data-part="pricing-table"]');
        const part = await frame(page).locator('[data-part="pricing-table"]').boundingBox();
        await page.mouse.move(part!.x + 5, part!.y + 5);
        await expect(label(page)).toContainText("料金表");
        const box = await boxes(page).first().boundingBox();
        expect(Math.abs(box!.width - part!.width)).toBeLessThan(2);
        expect(Math.abs(box!.height - part!.height)).toBeLessThan(2);
    });

    test("?part= と幅を付けて開くと、iframe の中のそのパーツを囲む", async ({ page }) => {
        await openConcept(page, "/catalog/saas?width=tablet&part=testimonial");
        await waitForFrame(page);
        await expect(stage(page)).toHaveAttribute("data-mode", "parts");
        await expect(boxes(page)).toHaveCount(1);
        await expect(frame(page).locator('[data-part="testimonial"]')).toBeInViewport();
    });

    test("横の一覧を指すと、iframe の中の同じパーツが囲まれる", async ({ page }) => {
        await openConcept(page, "/catalog/saas?width=phone");
        await waitForFrame(page);
        await page.getByRole("navigation", { name: "このページのパーツ" }).getByRole("link", { name: "料金表" }).hover();
        await expect(boxes(page)).toHaveCount(1);
    });

    test("画面に合わせる幅に戻すと、iframe が無くなり URL からも外れる", async ({ page }) => {
        await openConcept(page, "/catalog/saas?width=tablet");
        await waitForFrame(page);
        await page.getByRole("button", { name: "画面に合わせる" }).click();
        await expect(frameEl(page)).toHaveCount(0);
        expect(urlOf(page)).toBe("/catalog/saas");
    });

    test("見本だけのページは、検索に載せない", async ({ page }) => {
        await page.goto("/catalog-frame/kissa");
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
        // サイトのヘッダー（名前のロゴ）は出さない。見本の中にも header はあるので、名前で確かめる
        await expect(page.getByText("Kamijo Haruto")).toHaveCount(0);
        await expect(page.locator("[data-catalog-frame]")).toBeVisible();
    });
});

test.describe("表示する幅（スマホの画面）", () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

    test("幅の切り替えは出さず、?width= が付いていても画面に合わせて描く", async ({ page }) => {
        await openConcept(page, "/catalog/saas?width=pc");
        await expect(page.getByRole("group", { name: "表示する幅" })).toBeHidden();
        await expect(frameEl(page)).toHaveCount(0);
        await expect(stage(page).locator('[data-part="feature-grid"]')).toBeVisible();
    });
});

test.describe("パーツ図鑑のコード", () => {
    test.use({ permissions: ["clipboard-read", "clipboard-write"] });

    test("「コードを見る」で、描いた HTML とクラスが出て、コピーできる", async ({ page }) => {
        await page.goto("/catalog/parts#cta-button");
        const card = page.locator("section#cta-button article").first();
        const code = card.locator("pre code");
        await expect(code).toBeHidden();
        await card.getByText("コードを見る").click();
        await expect(code).toContainText('<button class="');
        await expect(code).not.toContainText("data-part");
        await expect(code).not.toContainText("inert");

        await card.getByRole("button", { name: "コピー" }).click();
        await expect(card.getByRole("status")).toHaveText("コピーしました");
        // Windows ではクリップボードの改行が \r\n になるので、そろえて比べる
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        expect(copied.replace(/\r\n/g, "\n")).toBe(await code.textContent());
    });

    test("英語のページでも、同じように出る", async ({ page }) => {
        await page.goto("/en/catalog/parts#cta-button");
        const card = page.locator("section#cta-button article").first();
        await card.getByText("Show code").click();
        await expect(card.locator("pre code")).toContainText("class=");
    });
});
