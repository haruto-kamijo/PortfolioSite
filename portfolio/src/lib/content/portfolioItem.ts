// src/lib/content/portfolioItem.ts

import { LOCALES, Localized } from "@/lib/i18n";
import { readLocalized, str, strList, writeLocalized } from "./fields";
import { PORTFOLIO_CATEGORIES, PortfolioCategory, PortfolioItem, PortfolioLink } from "./types";

/**
 * 作品(portfolioItems)の入力チェックと Firestore との変換。
 * 管理画面（admin/portfolio/actions.ts）と登録スクリプト（scripts/content.ts）の両方から使い、
 * どちらから登録しても同じ決まりになるようにする。
 */

export const PORTFOLIO_LIMITS = { title: 100, caption: 300, href: 500, links: 5, tags: 8, tag: 30 } as const;

/** カバー画像の上限。storage.rules と同じ値にする */
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

/** タイトル・説明文は日英で持つ。英語が空なら公開ページで日本語を代わりに出す */
export type PortfolioItemFields = { title: Localized; caption: Localized; href: string; ready: boolean };

export const isPortfolioCategory = (value: unknown): value is PortfolioCategory =>
    typeof value === "string" && (PORTFOLIO_CATEGORIES as readonly string[]).includes(value);

export const isDocId = (id: string) => /^[A-Za-z0-9_-]{1,128}$/.test(id);

const trimLocalized = (value: Localized): Localized => ({ ja: value.ja.trim(), en: value.en.trim() });

export const trimPortfolioFields = (input: PortfolioItemFields): PortfolioItemFields => ({
    title: trimLocalized(input.title),
    caption: trimLocalized(input.caption),
    href: input.href.trim(),
    ready: input.ready,
});

const isHttpUrl = (href: string) => /^https?:\/\//.test(href);

/** href は空欄も許す（写真などリンクの無い作品があるため） */
export const validatePortfolioFields = ({ title, caption, href }: PortfolioItemFields): string | null => {
    if (!title.ja) return "タイトル（日本語）を入力してください";
    if (LOCALES.some((l) => title[l].length > PORTFOLIO_LIMITS.title)) return "タイトルが長すぎます";
    if (LOCALES.some((l) => caption[l].length > PORTFOLIO_LIMITS.caption)) return "説明文が長すぎます";
    if (href.length > PORTFOLIO_LIMITS.href) return "リンク先が長すぎます";
    if (href && !isHttpUrl(href)) return "リンク先は http:// か https:// から始めてください";
    return null;
};

export const validatePortfolioLinks = (links: PortfolioLink[]): string | null => {
    if (links.length > PORTFOLIO_LIMITS.links) return `リンクは${PORTFOLIO_LIMITS.links}個までです`;
    for (const link of links) {
        if (!link.label.ja) return "リンクの名前（日本語）を入力してください";
        if (LOCALES.some((l) => link.label[l].length > 40)) return "リンクの名前が長すぎます";
        if (link.href.length > PORTFOLIO_LIMITS.href || !isHttpUrl(link.href)) {
            return "リンクは http:// か https:// から始まる URL にしてください";
        }
    }
    return null;
};

export const validatePortfolioTags = (tags: string[]): string | null => {
    if (tags.length > PORTFOLIO_LIMITS.tags) return `タグは${PORTFOLIO_LIMITS.tags}個までです`;
    if (tags.some((t) => !t)) return "空のタグがあります";
    if (tags.some((t) => t.length > PORTFOLIO_LIMITS.tag)) return `タグは${PORTFOLIO_LIMITS.tag}文字までです`;
    if (new Set(tags).size !== tags.length) return "同じタグが2回書かれています";
    return null;
};

/** Firestore に保存する形（title / titleEn のように平らにする）。空のリンクは null で持つ */
export const toPortfolioDoc = (fields: PortfolioItemFields) => ({
    ...writeLocalized("title", fields.title),
    ...writeLocalized("caption", fields.caption),
    href: fields.href || null,
    ready: fields.ready,
});

export const toPortfolioLinksDoc = (links: PortfolioLink[]) =>
    links.map((l) => ({ ...writeLocalized("label", l.label), href: l.href }));

/**
 * 読み出すときにも http(s) のリンクだけを通す。書き込み側でも確かめているが、
 * Firestore のルールではスキームまでは縛れないため、javascript: などが入っていても公開ページに出さない
 */
const safeHref = (value: unknown) => {
    const href = str(value);
    return isHttpUrl(href) ? href : "";
};

const readLinks = (value: unknown): PortfolioLink[] =>
    Array.isArray(value)
        ? value
              .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
              .map((v) => ({ label: readLocalized(v, "label"), href: safeHref(v.href) }))
              .filter((l) => l.label.ja && l.href)
        : [];

const readTags = (value: unknown) =>
    strList(value)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, PORTFOLIO_LIMITS.tags);

/**
 * Firestore のドキュメントを PortfolioItem にする。カテゴリが不明なものは null。
 * createdAt にはドキュメントの作成日時（Firestore が持っている createTime）を渡す
 */
export const readPortfolioItem = (
    id: string,
    d: Record<string, unknown>,
    createdAt?: Date
): PortfolioItem | null => {
    if (!isPortfolioCategory(d.category)) return null;
    return {
        id,
        category: d.category,
        title: readLocalized(d, "title"),
        caption: readLocalized(d, "caption"),
        href: safeHref(d.href) || null,
        links: readLinks(d.links),
        tags: readTags(d.tags),
        order: typeof d.order === "number" ? d.order : 0,
        coverUrl: str(d.coverUrl) || null,
        ready: d.ready === true,
        createdAt: createdAt?.toISOString() ?? null,
    };
};
