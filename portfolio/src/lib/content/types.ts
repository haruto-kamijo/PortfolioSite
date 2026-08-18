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
} as const;

/** プロフィールは単一ドキュメント */
export const PROFILE_DOC_ID = "main";
