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

export type KnownTargets = { external: Set<string>; tags: Set<string> };

const TTL_MS = 5 * 60 * 1000;

const siteHost = new URL(site.url).hostname;

let cached: { at: number; value: Promise<KnownTargets> } | null = null;

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

    const tags = new Set<string>();
    for (const item of [CATALOG_PORTFOLIO_ITEM, ...registered]) {
        for (const tag of item.tags) tags.add(tagKey(tag));
    }
    return { external, tags };
};

export const getKnownTargets = (now = Date.now()): Promise<KnownTargets> => {
    if (!cached || now - cached.at > TTL_MS) {
        const value = load();
        cached = { at: now, value };
        // 読めなかったときは覚えておかず、次の操作で読み直す
        value.catch(() => {
            if (cached?.value === value) cached = null;
        });
    }
    return cached.value;
};
