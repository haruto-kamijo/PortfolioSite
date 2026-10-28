// src/lib/content/types.ts

import type { Localized, LocalizedList } from "@/lib/i18n";

/**
 * 管理画面(CMS)で編集する公開コンテンツの型。Firestore と静的既定値で共通に使う。
 *
 * 文章は日英の両方を Localized で持つ。Firestore では日本語を元のフィールド名（title）、
 * 英語を末尾に En を付けたフィールド名（titleEn）に平らに保存する
 * （英語を足す前に保存したドキュメントも、そのまま日本語として読めるようにするため）。
 */

export type ProfileContent = {
    /** 日本語の名前（上條 遥都）と英語の名前（Kamijo Haruto） */
    name: Localized;
    role: Localized;
    tagline: Localized;
    description: Localized;
    school: Localized;
    schoolShort: Localized;
    program: Localized;
    /** 学年の手動上書き。null のときは年度から自動計算する */
    gradeOverride: string | null;
    hobbies: LocalizedList;
    /** プログラミング言語の名前なので、日英で分けない */
    languages: string[];
};

export type SkillGroupContent = {
    id: string;
    field: Localized;
    items: LocalizedList;
    order: number;
};

export type WorkContent = {
    id: string;
    title: Localized;
    caption: Localized;
    /** 日本語版のパス（/portfolio?tab=sites）か外部URL。英語版では /en を付けて使う */
    href: string;
    external: boolean;
    /** false のあいだはリンクを張らず「準備中」として表示する */
    ready: boolean;
    order: number;
    /** Storage にアップロードしたカバー画像の公開URL */
    coverUrl: string | null;
};

export type SiteContent = {
    profile: ProfileContent;
    skillGroups: SkillGroupContent[];
    works: WorkContent[];
    /** どこから読めたか。既定値のままか Firestore 由来かを画面や調査で判別するため */
    source: "firestore" | "defaults";
};

/** /portfolio ページのタブ */
export const PORTFOLIO_CATEGORIES = ["sites", "games", "models", "photos", "blog"] as const;
export type PortfolioCategory = (typeof PORTFOLIO_CATEGORIES)[number];

export const PORTFOLIO_CATEGORY_LABELS: Record<PortfolioCategory, Localized> = {
    sites: { ja: "Webサイト", en: "Web Sites" },
    games: { ja: "ゲーム", en: "Games" },
    models: { ja: "3Dモデル", en: "3D Models" },
    photos: { ja: "写真", en: "Photos" },
    // 記事本文は note 側に置いたまま、ここには一覧カードだけを手動登録する
    // （PortfolioItem.href に note の記事URLを入れる運用）
    blog: { ja: "ブログ", en: "Blog" },
};

/**
 * /portfolio の各カテゴリに載る個々の作品。
 * home の WORKS カード(WorkContent)とは別物：カードはカテゴリへの入口、
 * こちらはカテゴリの中身（実際の1作品ずつ）。
 */
export type PortfolioItem = {
    id: string;
    category: PortfolioCategory;
    title: Localized;
    caption: Localized;
    /** 外部リンクが無い作品（写真など）もあるため任意 */
    href: string | null;
    /** カテゴリ内での並び順。カテゴリをまたいだ比較はしない */
    order: number;
    coverUrl: string | null;
    ready: boolean;
};

/** 問い合わせ。クライアントからは読めない（API Route の Admin SDK 経由のみ） */
export type ContactMessage = {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: string;
    read: boolean;
};

/** Firestore のコレクション名 */
export const collections = {
    profile: "profile",
    skillGroups: "skillGroups",
    works: "works",
    contacts: "contacts",
    portfolioItems: "portfolioItems",
} as const;

/** プロフィールは単一ドキュメント */
export const PROFILE_DOC_ID = "main";
