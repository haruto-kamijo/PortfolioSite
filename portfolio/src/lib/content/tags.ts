// src/lib/content/tags.ts

import { Locale, localizePath } from "@/lib/i18n";
import { PORTFOLIO_LIMITS } from "./portfolioItem";
import type { PortfolioCategory, PortfolioItem } from "./types";

/**
 * /portfolio のタグでの絞り込み。?tag=Next.js&tag=Firebase のように、選んだタグを URL に並べる。
 * 選んだタグを全部持つ作品だけを、カテゴリをまたいで出す。
 * 大文字・小文字の違い（next.js と Next.js）は同じタグとみなす（登録の書き方の揺れで作品が分かれないように）
 */

/** URL で一度に選べるタグの数。これより後ろは読まない */
export const MAX_SELECTED_TAGS = 5;

/** タグを比べるときの形 */
export const tagKey = (tag: string) => tag.toLowerCase();

/**
 * 制御文字と、見えない書式文字（文字の向きを変える U+202E・ゼロ幅の空白・行の区切り U+2028・BOM など）。URL から来たタグに入っていたら読まない。
 * ビルドの対象が ES5 で \p{Cf} が使えないので、範囲で書く
 */
const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u180e\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff\ufff9-\ufffb]/;

/** ?tag= の値を、選んだタグの一覧にする。空・長すぎるもの・見えない文字を含むもの・重複は捨てる */
export const readSelectedTags = (value: string | string[] | undefined): string[] => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const raw of values) {
        const tag = raw.trim();
        if (!tag || tag.length > PORTFOLIO_LIMITS.tag || INVISIBLE.test(tag) || seen.has(tagKey(tag))) continue;
        seen.add(tagKey(tag));
        tags.push(tag);
    }
    return tags.slice(0, MAX_SELECTED_TAGS);
};

export const hasTag = (tags: string[], tag: string) => tags.some((t) => tagKey(t) === tagKey(tag));

export const hasAllTags = (item: PortfolioItem, selected: string[]) => selected.every((tag) => hasTag(item.tags, tag));

/**
 * 作品に付いているタグと、そのタグの作品の数。多い順、同じ数なら名前順。
 * 書き方が揺れているタグは1つにまとめ、作品の多いほうの書き方で出す（同じ数なら先に出てきたほう）
 */
export const countTags = (items: PortfolioItem[]): { tag: string; count: number }[] => {
    const groups = new Map<string, { count: number; spellings: Map<string, number> }>();
    for (const item of items) {
        // 1つの作品に同じタグが書き方を変えて2回あっても、1件と数える（先に書いたほうの書き方を使う）
        const own = new Map<string, string>();
        for (const tag of item.tags) if (!own.has(tagKey(tag))) own.set(tagKey(tag), tag);
        own.forEach((tag, key) => {
            const group = groups.get(key) ?? { count: 0, spellings: new Map<string, number>() };
            group.count += 1;
            group.spellings.set(tag, (group.spellings.get(tag) ?? 0) + 1);
            groups.set(key, group);
        });
    }
    return Array.from(groups.values(), ({ count, spellings }) => ({
        // Map は入れた順なので、数が同じなら先に出てきた書き方が残る
        tag: Array.from(spellings).reduce((a, b) => (b[1] > a[1] ? b : a))[0],
        count,
    })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "ja"));
};

/**
 * タグを選んだ状態の URL。tab は絞り込む前に開いていたタブで、解除したときにそこへ戻れるよう URL に残す。
 * タグが無くなったら、そのタブ（tab が無ければタブの指定のない /portfolio）に戻る
 */
export const tagsHref = (tags: string[], tab: PortfolioCategory | null, lang: Locale) => {
    const params = new URLSearchParams(tab ? [["tab", tab]] : []);
    for (const tag of tags) params.append("tag", tag);
    const query = params.toString();
    return localizePath(query ? `/portfolio?${query}` : "/portfolio", lang);
};

/** tag を選んでいれば外し、選んでいなければ足した URL */
export const toggleTagHref = (selected: string[], tag: string, tab: PortfolioCategory | null, lang: Locale) =>
    tagsHref(
        hasTag(selected, tag) ? selected.filter((t) => tagKey(t) !== tagKey(tag)) : [...selected, tag],
        tab,
        lang
    );
