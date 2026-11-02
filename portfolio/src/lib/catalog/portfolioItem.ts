// src/lib/catalog/portfolioItem.ts

import type { PortfolioItem } from "@/lib/content/types";

/**
 * 制作物の「Webサイト」のタブに出す、デザインカタログのカード。
 * カタログはこのサイトの中のページなので、Firestore に登録せずコードに置く（href はサイト内のパス）
 */
export const CATALOG_PORTFOLIO_ITEM: PortfolioItem = {
    id: "design-catalog",
    category: "sites",
    title: { ja: "デザインカタログ", en: "Design Catalog" },
    caption: {
        ja: "目的の違う架空のサイト4つを、和モダン・グラスモーフィズム・ブルータリズム・ミニマルで作り分けた見本集。UI パーツの名前と見本を紐づけて引ける。",
        en: "Four fictional websites, each built in a different style: Japanese modern, glassmorphism, brutalism and minimal. Every UI part is named and linked to a field guide.",
    },
    href: "/catalog",
    links: [],
    tags: ["Next.js", "Tailwind CSS", "TypeScript"],
    order: 0,
    coverUrl: "/catalog-cover.png",
    ready: true,
    createdAt: null,
};
