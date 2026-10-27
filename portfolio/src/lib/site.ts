// src/lib/site.ts
// サイト全体で使う定数・コンテンツの単一ソース。
// ページ側にテキストを直書きせず、ここを更新すれば全ページに反映される。
// 表示する文章は日英の両方を持つ（言語の切り替えは src/lib/i18n.ts）。

import type { Localized, LocalizedList } from "@/lib/i18n";

export const site = {
    /** ロゴ横やタイトルに使う表記。言語に関わらずローマ字で出す */
    name: "Kamijo Haruto",
    nameJa: "上條 遥都",
    role: {
        ja: "デザイナー / 開発者 / クリエイター",
        en: "Designer / Developer / Creator",
    } satisfies Localized,
    tagline: {
        ja: "可能性という名の宇宙を進み続ける",
        en: "Always moving forward through a universe of possibilities",
    } satisfies Localized,
    description: {
        ja: "上條遥都のポートフォリオサイト。Web / ゲーム / AI / 3Dモデルの制作物をまとめています。",
        en: "Portfolio of Kamijo Haruto, featuring work in web, games, AI, and 3D modeling.",
    } satisfies Localized,
    url: "https://kamijoharuto.com",
    copyrightSince: 2024,
};

export const links = {
    github: "https://github.com/haruto-kamijo",
    note: "https://note.com/pon20020929/",
    mail: "kamijoharuto@gmail.com",
};

export type NavItem = {
    label: Localized;
    href: string;
    /** false のうちは Header 上で "Soon" 表示にしてリンクを張らない */
    ready: boolean;
    external?: boolean;
};

/**
 * ヘッダーのナビゲーション。
 * リプレイス中はページが揃っていないため ready フラグで制御している。
 * ページを実装したら該当行を ready: true に変えるだけでリンクが有効になる。
 * href は日本語版のパスで書く（英語版では /en を付けて使う）。
 */
export const nav: readonly NavItem[] = [
    { label: { ja: "ホーム", en: "Home" }, href: "/home", ready: true },
    { label: { ja: "プロフィール", en: "About" }, href: "/about", ready: true },
    { label: { ja: "制作物", en: "Works" }, href: "/portfolio", ready: true },
    { label: { ja: "ブログ", en: "Blog" }, href: links.note, ready: true, external: true },
    { label: { ja: "お問い合わせ", en: "Contact" }, href: "/contact", ready: true },
];

export type SkillGroup = { id: string; field: Localized; items: LocalizedList };

export const skills: readonly SkillGroup[] = [
    {
        id: "web",
        field: { ja: "Web", en: "Web" },
        items: {
            ja: ["HTML / CSS / JS", "TS / Next.js / Tailwind"],
            en: ["HTML / CSS / JS", "TS / Next.js / Tailwind"],
        },
    },
    {
        id: "game",
        field: { ja: "ゲーム", en: "Game" },
        items: {
            ja: ["Java / Android Studio", "C# / Unity"],
            en: ["Java / Android Studio", "C# / Unity"],
        },
    },
    {
        id: "ai",
        field: { ja: "AI", en: "AI" },
        items: {
            ja: ["Python / PyTorch", "Python / TensorFlow / Keras"],
            en: ["Python / PyTorch", "Python / TensorFlow / Keras"],
        },
    },
    {
        id: "other",
        field: { ja: "その他", en: "Other" },
        items: {
            ja: ["3Dモデル / Blender", "デザイン / Illustrator / Photoshop"],
            en: ["3D Model / Blender", "Design / Illustrator / Photoshop"],
        },
    },
];

export type Work = {
    id: string;
    title: Localized;
    caption: Localized;
    href: string;
    ready: boolean;
    external?: boolean;
};

export const works: readonly Work[] = [
    {
        id: "web-sites",
        title: { ja: "Webサイト", en: "Web Sites" },
        caption: { ja: "制作したWebサイト", en: "Websites I've built" },
        href: "/portfolio?tab=sites",
        ready: true,
    },
    {
        id: "games",
        title: { ja: "ゲーム", en: "Games" },
        caption: { ja: "ゲーム制作", en: "Games I've made" },
        href: "/portfolio?tab=games",
        ready: true,
    },
    {
        id: "3d-models",
        title: { ja: "3Dモデル", en: "3D Models" },
        caption: { ja: "Blenderでのモデリング", en: "Modeling in Blender" },
        href: "/portfolio?tab=models",
        ready: true,
    },
    {
        id: "photos",
        title: { ja: "写真", en: "Photos" },
        caption: { ja: "撮影した写真", en: "Photos I've taken" },
        href: "/portfolio?tab=photos",
        ready: true,
    },
    {
        id: "github",
        title: { ja: "GitHub", en: "GitHub" },
        caption: { ja: "ソースコード", en: "Source code" },
        href: links.github,
        ready: true,
        external: true,
    },
];

/** プロフィール情報。/about でも同じ値を使う */
export const profile = {
    school: { ja: "長岡技術科学大学", en: "Nagaoka University of Technology" } satisfies Localized,
    schoolShort: { ja: "長岡技大", en: "NUT" } satisfies Localized,
    program: {
        ja: "情報・経営システム工学",
        en: "Information & Management Systems Engineering",
    } satisfies Localized,
    hobbies: {
        ja: ["プログラミング", "ゲーム", "ファッション", "香水", "カメラ"],
        en: ["Programming", "Game", "Fashion", "Perfume", "Camera"],
    } satisfies LocalizedList,
    languages: ["Python", "C", "C++", "C#", "Java", "HTML/CSS", "JS", "TS", "R"],
};
