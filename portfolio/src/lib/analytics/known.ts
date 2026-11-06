// src/lib/analytics/known.ts

import { CATALOG_PORTFOLIO_ITEM } from "@/lib/catalog/portfolioItem";
import { getFeedItems } from "@/lib/content/feeds";
import { getCareer } from "@/lib/content/getCareer";
import { getPortfolioItems } from "@/lib/content/getPortfolioItems";
import { getSiteContent } from "@/lib/content/getSiteContent";
import { tagKey } from "@/lib/content/tags";
import { PORTFOLIO_CATEGORIES } from "@/lib/content/types";
import { links, nav, site } from "@/lib/site";
import { externalKey } from "./events";

/**
 * サイトに実際に出ている外へのリンクとタグ（サーバー専用）。
 * 操作の回数は誰でも送れるので、ここに無いものは数えない（でたらめな URL やタグで記録が埋まらないように）。
 * 作品やブログの記事を足したときに追いつけるよう、5 分ごとに読み直す
 */

export type KnownTargets = {
    external: Set<string>;
    /** 比べるときの形（小文字）から、作品に付いている書き方へ */
    tags: Map<string, string>;
    /** 登録した作品が 1 件も無かった（読めなかったのかもしれない） */
    noItems: boolean;
};

const TTL_MS = 5 * 60 * 1000;
/** 作品が 1 件も読めなかったときに覚えておく時間。作品の読み込みは失敗しても例外にならず空になるので、一時的に読めなかっただけのときに長く引きずらない */
const EMPTY_TTL_MS = 30 * 1000;

const siteHost = new URL(site.url).hostname;

let cached: { at: number; ttl: number; value: Promise<KnownTargets> } | null = null;

const load = async (): Promise<KnownTargets> => {
    const [content, items, career] = await Promise.all([
        getSiteContent(),
        getPortfolioItems(),
        // 経歴を読めなかったときは、経歴のリンクだけ数えない
        getCareer().catch(() => []),
    ]);
    const feed = await getFeedItems(items.blog);
    const registered = PORTFOLIO_CATEGORIES.flatMap((c) => items[c]);

    const hrefs = [
        links.github,
        links.note,
        links.zenn,
        ...nav.filter((n) => n.external).map((n) => n.href),
        ...content.works.filter((w) => w.external).map((w) => w.href),
        ...[...registered, ...feed].flatMap((item) => [item.href ?? "", ...item.links.map((l) => l.href)]),
        ...career.flatMap((item) => item.links.map((l) => l.href)),
    ];
    const external = new Set<string>();
    for (const href of hrefs) {
        const key = externalKey(href, siteHost);
        if (key) external.add(key);
    }

    const tags = new Map<string, string>();
    for (const item of [CATALOG_PORTFOLIO_ITEM, ...registered]) {
        for (const tag of item.tags) if (!tags.has(tagKey(tag))) tags.set(tagKey(tag), tag);
    }
    return { external, tags, noItems: registered.length === 0 };
};

export const getKnownTargets = (now = Date.now()): Promise<KnownTargets> => {
    if (!cached || now - cached.at > cached.ttl) {
        const value = load();
        const entry = { at: now, ttl: TTL_MS, value };
        cached = entry;
        value.then(
            (known) => {
                if (known.noItems) entry.ttl = EMPTY_TTL_MS;
            },
            // 読めなかったときは覚えておかず、次の操作で読み直す
            () => {
                if (cached === entry) cached = null;
            }
        );
    }
    return cached.value;
};
