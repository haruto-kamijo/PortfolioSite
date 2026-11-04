// src/lib/content/career.test.ts
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseCareerFile, readCareerDoc, sortCareer, yearOf } from "./career";

/** 経歴の登録ファイルの決まりと並べ方。`npm test` で動かす */

const entry = (over: Record<string, unknown> = {}) => ({
    id: "lab",
    kind: "research",
    start: "2025-04",
    end: "present",
    title: { ja: "研究室に配属", en: "Joined the lab" },
    ...over,
});

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
        const { items, errors } = parseCareerFile({
            items: [entry({ id: "Bad ID", kind: "hobby", start: "2025/04", end: "2024-13", title: { en: "x" } })],
        });
        assert.deepEqual(items, []);
        assert.equal(errors.length, 5);
        assert.ok(errors.every((e) => e.startsWith("items[0]")));
    });

    test("id の重なり・終わりが始まりより前・リンクの形を確かめる", () => {
        const { errors } = parseCareerFile({
            items: [
                entry(),
                entry({ start: "2025-04", end: "2024", links: [{ label: { ja: "記事" }, href: "javascript:alert(1)" }, { label: { ja: "作品" }, href: "//evil.example" }] }),
            ],
        });
        assert.ok(errors.some((e) => e.includes("重なっています")));
        assert.ok(errors.some((e) => e.includes("start より前")));
        assert.equal(errors.filter((e) => e.includes(".href")).length, 2);
    });

    test("サイトの中のパスと https の URL はリンクにできる", () => {
        const { errors } = parseCareerFile({
            items: [entry({ links: [{ label: { ja: "作品" }, href: "/portfolio?tag=Python" }, { label: { ja: "論文" }, href: "https://example.com/paper" }] })],
        });
        assert.deepEqual(errors, []);
    });

    test("全体の形が違うときは、そのことだけを返す", () => {
        assert.deepEqual(parseCareerFile([]).errors, ['{ "items": [ ... ] } の形で書いてください']);
    });
});

describe("readCareerDoc", () => {
    test("形の崩れた項目だけを飛ばす", () => {
        const items = readCareerDoc({ items: [entry(), { id: "broken" }, entry({ id: "award", kind: "achievement", start: "2024", end: null })] });
        assert.deepEqual(
            items.map((i) => i.id),
            ["lab", "award"]
        );
        assert.deepEqual(readCareerDoc(undefined), []);
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
