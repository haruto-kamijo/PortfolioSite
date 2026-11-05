// src/lib/content/career.test.ts
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { careerHrefKind, diffCareer, isPlanned, monthInTokyo, parseCareerFile, readCareerDoc, sortCareer, yearOf } from "./career";

/** 経歴の登録ファイルの決まりと並べ方。`npm test` で動かす */

const entry = (over: Record<string, unknown> = {}) => ({
    id: "lab",
    kind: "research",
    start: "2025-04",
    end: "present",
    title: { ja: "研究室に配属", en: "Joined the lab" },
    ...over,
});

const one = (over: Record<string, unknown> = {}) => parseCareerFile({ items: [entry(over)] });

describe("parseCareerFile", () => {
    test("正しい項目を読み、省いた欄は空にする", () => {
        const { items, errors } = parseCareerFile({ items: [entry({ end: undefined, title: { ja: "  受賞  " } })] });
        assert.deepEqual(errors, []);
        assert.deepEqual(items[0], {
            id: "lab",
            kind: "research",
            start: "2025-04",
            end: null,
            title: { ja: "受賞", en: "" },
            org: { ja: "", en: "" },
            description: { ja: "", en: "" },
            links: [],
        });
    });

    test("形が違うときは、どこが違うかを返し、項目は返さない", () => {
        const { items, errors } = one({ id: "Bad ID", kind: "hobby", start: "2025/04", end: "2024-13", title: { en: "x" } });
        assert.deepEqual(items, []);
        assert.equal(errors.length, 5);
        assert.ok(errors.every((e) => e.startsWith("items[0]")));
    });

    test("知らない名前（綴りの誤り）は誤りにする", () => {
        const { errors } = one({ descripton: { ja: "説明" }, links: [{ label: { ja: "記事", jp: "x" }, href: "https://example.com", url: "x" }] });
        assert.ok(errors.some((e) => e.includes("items[0] に知らない名前") && e.includes("descripton")));
        assert.ok(errors.some((e) => e.includes("items[0].links[0] に知らない名前") && e.includes("url")));
        assert.ok(errors.some((e) => e.includes("label に知らない名前") && e.includes("jp")));
    });

    test("文章の欄に文字列でないものを書くと誤りにする", () => {
        const { errors } = one({ org: { ja: 123 } });
        assert.ok(errors.some((e) => e.includes("org.ja は文字列")));
    });

    test("文字数の上限を超えると誤りにする", () => {
        assert.ok(one({ title: { ja: "あ".repeat(121) } }).errors.some((e) => e.includes("120 文字まで")));
        assert.deepEqual(one({ title: { ja: "あ".repeat(120) } }).errors, []);
    });

    test("id の重なりと、終わりが始まりより前を確かめる", () => {
        const { errors } = parseCareerFile({ items: [entry(), entry({ start: "2025-04", end: "2024" })] });
        assert.ok(errors.some((e) => e.includes("重なっています")));
        assert.ok(errors.some((e) => e.includes("start より前")));
    });

    test("年だけの終わりは、その年の終わりとみなす（同じ年の月の始まりより前にしない）", () => {
        assert.deepEqual(one({ start: "2024-04", end: "2024" }).errors, []);
        assert.deepEqual(one({ start: "2024", end: "2024-03" }).errors, []);
    });

    test("リンクは https の URL か、サイトの中のパスだけ", () => {
        const href = (h: string) => one({ links: [{ label: { ja: "リンク" }, href: h }] }).errors.length === 0;
        assert.equal(href("/portfolio?tag=Python"), true);
        assert.equal(href("https://example.com/paper"), true);
        for (const bad of ["http://example.com", "javascript:alert(1)", "//evil.example", "/\t/evil.example", "/\n/evil.example", "/\\evil.example", "/en/portfolio", "/ja", "https://exa mple.com", ""]) {
            assert.equal(href(bad), false, bad);
        }
    });

    test("全体の形が違うときは、そのことだけを返す", () => {
        assert.deepEqual(parseCareerFile([]).errors, ['{ "items": [ ... ] } の形で書いてください']);
    });
});

describe("careerHrefKind", () => {
    test("サイトの中と外を分ける", () => {
        assert.equal(careerHrefKind("/career"), "internal");
        assert.equal(careerHrefKind("/english"), "internal");
        assert.equal(careerHrefKind("https://example.com"), "external");
        assert.equal(careerHrefKind("/\u0000/evil"), null);
    });
});

describe("readCareerDoc", () => {
    test("形の崩れた項目は飛ばし、その id を返す", () => {
        const { items, unreadable } = readCareerDoc({
            items: [entry(), { id: "broken" }, 42, entry({ id: "award", kind: "achievement", start: "2024", end: null })],
        });
        assert.deepEqual(
            items.map((i) => i.id),
            ["lab", "award"]
        );
        assert.deepEqual(unreadable, ["broken", "items[2]"]);
    });

    test("まだ無いときは空、全体の形が違うときはそのことを返す", () => {
        assert.deepEqual(readCareerDoc(undefined), { items: [], unreadable: [] });
        assert.equal(readCareerDoc({ items: "x" }).unreadable.length, 1);
    });
});

describe("diffCareer", () => {
    test("足す・変わる・消すを分ける", () => {
        const a = one({ id: "a" }).items[0];
        const b = one({ id: "b" }).items[0];
        const b2 = one({ id: "b", title: { ja: "別の名前" } }).items[0];
        const c = one({ id: "c" }).items[0];
        assert.deepEqual(diffCareer([a, b], [b2, c]), { added: ["c"], changed: ["b"], removed: ["a"] });
        assert.deepEqual(diffCareer([a], [a]), { added: [], changed: [], removed: [] });
    });
});

describe("sortCareer", () => {
    test("始まりが新しい順。同じなら続いているもの・終わりが新しいものを先、年だけのものは同じ年の中で後ろ", () => {
        const { items } = parseCareerFile({
            items: [
                entry({ id: "a", start: "2022-04", end: "2026-03" }),
                entry({ id: "b", start: "2025-04", end: "present" }),
                entry({ id: "c", start: "2025-04", end: "2025-09" }),
                entry({ id: "d", start: "2025", end: null }),
                entry({ id: "e", start: "2025-10", end: null }),
            ],
        });
        assert.deepEqual(
            sortCareer(items).map((i) => i.id),
            ["e", "b", "c", "d", "a"]
        );
        assert.equal(yearOf(items[0]), "2022");
    });
});

describe("isPlanned と monthInTokyo", () => {
    test("始まりが今月より先の項目だけが予定", () => {
        const item = (start: string) => one({ start, end: null }).items[0];
        assert.equal(isPlanned(item("2026-12"), "2026-11"), true);
        assert.equal(isPlanned(item("2026-11"), "2026-11"), false);
        assert.equal(isPlanned(item("2027"), "2026-11"), true);
        assert.equal(isPlanned(item("2026"), "2026-11"), false);
    });

    test("日本時間の年月にする（UTC ではまだ前の月の夜でも、日本では次の月）", () => {
        assert.equal(monthInTokyo(new Date("2026-11-30T16:00:00Z")), "2026-12");
        assert.equal(monthInTokyo(new Date("2026-11-30T14:00:00Z")), "2026-11");
    });
});
