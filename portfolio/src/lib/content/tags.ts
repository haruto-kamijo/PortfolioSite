// src/lib/content/tags.ts

import { Locale, localizePath } from "@/lib/i18n";
import { PORTFOLIO_LIMITS } from "./portfolioItem";
import type { PortfolioItem } from "./types";

/**
 * /portfolio のタグでの絞り込み。?tag=Next.js&tag=Firebase のように、選んだタグを URL に並べる。
 * 選んだタグを全部持つ作品だけを、カテゴリをまたいで出す
 */

/** URL で一度に選べるタグの数。これより後ろは読まない */
export const MAX_SELECTED_TAGS = 5;

/** ?tag= の値を、選んだタグの一覧にする。空・長すぎるもの・重複は捨てる */
export const readSelectedTags = (value: string | string[] | undefined): string[] => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    const tags = values.map((v) => v.trim()).filter((v) => v && v.length <= PORTFOLIO_LIMITS.tag);
    return Array.from(new Set(tags)).slice(0, MAX_SELECTED_TAGS);
};

export const hasAllTags = (item: PortfolioItem, selected: string[]) => selected.every((tag) => item.tags.includes(tag));

/** 作品に付いているタグと、そのタグの作品の数。多い順、同じ数なら名前順 */
export const countTags = (items: PortfolioItem[]): { tag: string; count: number }[] => {
    const counts = new Map<string, number>();
    for (const item of items) for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return Array.from(counts, ([tag, count]) => ({ tag, count })).sort(
        (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ja")
    );
};

/** タグを選んだ状態の URL。タグが無くなったら、絞り込む前の /portfolio に戻す */
export const tagsHref = (tags: string[], lang: Locale) => {
    const query = new URLSearchParams(tags.map((tag) => ["tag", tag])).toString();
    return localizePath(query ? `/portfolio?${query}` : "/portfolio", lang);
};

/** tag を選んでいれば外し、選んでいなければ足した URL */
export const toggleTagHref = (selected: string[], tag: string, lang: Locale) =>
    tagsHref(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag], lang);
