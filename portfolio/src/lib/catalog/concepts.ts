// src/lib/catalog/concepts.ts

import type { Localized } from "@/lib/i18n";

/**
 * デザインカタログの見本のページ。目的の違う架空のサイトを、それぞれ別の見た目の流派で作っている。
 * ページの中身は components/catalog/concepts にあり、ここは一覧や見出しに出す説明だけを持つ。
 * どれも実在しないサイトで、URL には予約済みの .example を使う
 */
export const CATALOG_CONCEPT_IDS = ["kissa", "saas", "magazine", "studio"] as const;

export type CatalogConceptId = (typeof CATALOG_CONCEPT_IDS)[number];

export type CatalogConcept = {
    name: Localized;
    /** 見本の中のアドレスバーに出す架空のドメイン */
    domain: string;
    /** どんな目的のサイトか */
    purpose: Localized;
    /** 見た目の流派 */
    style: Localized;
    summary: Localized;
    font: Localized;
    /** 背景・文字・差し色などの主な色 */
    palette: string[];
};

export const CATALOG_CONCEPTS: Record<CatalogConceptId, CatalogConcept> = {
    kissa: {
        name: { ja: "喫茶 ほしづき", en: "Kissa Hoshizuki" },
        domain: "hoshizuki.example",
        purpose: { ja: "喫茶店のサイト", en: "Café website" },
        style: { ja: "和モダン", en: "Japanese modern" },
        summary: {
            ja: "生成りの紙のような背景に明朝体と朱色の差し色。縦書きの見出しと余白で、落ち着いた店の空気を出す。",
            en: "Serif type and a vermilion accent on a paper-like background. Vertical headings and generous space carry the calm of the shop.",
        },
        font: { ja: "明朝体", en: "Serif (Mincho)" },
        palette: ["#f4efe6", "#2b2622", "#b5452c", "#8a7a66"],
    },
    saas: {
        name: { ja: "Tasklane", en: "Tasklane" },
        domain: "tasklane.example",
        purpose: { ja: "タスク管理サービスの紹介ページ", en: "Landing page for a task app" },
        style: { ja: "グラスモーフィズム", en: "Glassmorphism" },
        summary: {
            ja: "鮮やかなグラデーションの上に、すりガラスのような半透明のパネルを重ねる。角を丸め、光と奥行きで先進的に見せる。",
            en: "Frosted, translucent panels layered over a vivid gradient. Rounded corners, light and depth give it a modern feel.",
        },
        font: { ja: "ゴシック体（システムフォント）", en: "Sans-serif (system font)" },
        palette: ["#312e81", "#7c3aed", "#ec4899", "#ffffff"],
    },
    magazine: {
        name: { ja: "THE GRID", en: "THE GRID" },
        domain: "thegrid.example",
        purpose: { ja: "カルチャー系のウェブマガジン", en: "Culture web magazine" },
        style: { ja: "ブルータリズム", en: "Brutalism" },
        summary: {
            ja: "太い黒の罫線、等幅フォント、蛍光イエロー。飾りを削り、構造をそのまま見せる荒々しさで個性を出す。",
            en: "Thick black rules, monospace type and fluorescent yellow. Strips away decoration and shows the raw structure as its character.",
        },
        font: { ja: "等幅フォントと極太のゴシック体", en: "Monospace with heavy sans-serif" },
        palette: ["#ffffff", "#111111", "#ffe500", "#ff3b1f"],
    },
    studio: {
        name: { ja: "Studio Kasumi", en: "Studio Kasumi" },
        domain: "studio-kasumi.example",
        purpose: { ja: "写真家のポートフォリオ", en: "Photographer's portfolio" },
        style: { ja: "ミニマル", en: "Minimal" },
        summary: {
            ja: "白と灰色だけで、細い文字と大きな余白。作品の写真が主役になるよう、UI は存在感を消す。",
            en: "Only white and grays, thin type and wide margins. The interface steps back so the photographs take center stage.",
        },
        font: { ja: "細いゴシック体", en: "Light sans-serif" },
        palette: ["#fafaf9", "#1c1917", "#a8a29e", "#e7e5e4"],
    },
};

export const isCatalogConceptId = (value: string): value is CatalogConceptId =>
    (CATALOG_CONCEPT_IDS as readonly string[]).includes(value);
