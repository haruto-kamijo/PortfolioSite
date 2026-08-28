// src/lib/content/types.ts

/** 管理画面(CMS)で編集する公開コンテンツの型。Firestore と静的既定値で共通に使う */

export type ProfileContent = {
    name: string;
    nameJa: string;
    role: string;
    tagline: string;
    description: string;
    school: string;
    schoolShort: string;
    program: string;
    programJa: string;
    /** 学年の手動上書き。null のときは年度から自動計算する */
    gradeOverride: string | null;
    hobbies: string[];
    languages: string[];
};

export type SkillGroupContent = {
    id: string;
    field: string;
    items: string[];
    order: number;
};

export type WorkContent = {
    id: string;
    title: string;
    caption: string;
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

export const PORTFOLIO_CATEGORY_LABELS: Record<PortfolioCategory, { en: string; ja: string }> = {
    sites: { en: "Web Sites", ja: "制作したWebサイト" },
    games: { en: "Games", ja: "ゲーム制作" },
    models: { en: "3D Models", ja: "Blenderでのモデリング" },
    photos: { en: "Photos", ja: "撮影した写真" },
    // 記事本文は note 側に置いたまま、ここには一覧カードだけを手動登録する
    // （PortfolioItem.href に note の記事URLを入れる運用）
    blog: { en: "Blog", ja: "書いた記事" },
};

/**
 * /portfolio の各カテゴリに載る個々の作品。
 * home の WORKS カード(WorkContent)とは別物：カードはカテゴリへの入口、
 * こちらはカテゴリの中身（実際の1作品ずつ）。
 */
export type PortfolioItem = {
    id: string;
    category: PortfolioCategory;
    title: string;
    caption: string;
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
