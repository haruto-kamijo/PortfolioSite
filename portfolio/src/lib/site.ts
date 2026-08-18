// src/lib/site.ts
// サイト全体で使う定数・コンテンツの単一ソース。
// ページ側にテキストを直書きせず、ここを更新すれば全ページに反映される。

export const site = {
    name: "Kamijo Haruto",
    nameJa: "上條 遥都",
    role: "Designer / Developer / Creator",
    tagline: "可能性という名の宇宙を進み続ける",
    description:
        "上條遥都のポートフォリオサイト。Web / ゲーム / AI / 3Dモデルの制作物をまとめています。",
    url: "https://kamijoharuto.com",
    copyrightSince: 2024,
} as const;

export const links = {
    github: "https://github.com/haruto-kamijo",
    note: "https://note.com/pon20020929/",
    mail: "kamijoharuto@gmail.com",
} as const;

export type NavItem = {
    label: string;
    href: string;
    /** false のうちは Header 上で "Soon" 表示にしてリンクを張らない */
    ready: boolean;
    external?: boolean;
};

/**
 * ヘッダーのナビゲーション。
 * リプレイス中はページが揃っていないため ready フラグで制御している。
 * ページを実装したら該当行を ready: true に変えるだけでリンクが有効になる。
 */
export const nav: readonly NavItem[] = [
    { label: "Home", href: "/home", ready: true },
    { label: "About", href: "/about", ready: false },
    { label: "Works", href: "/portfolio", ready: false },
    { label: "Blog", href: links.note, ready: true, external: true },
    { label: "Contact", href: "/contact", ready: true },
] as const;

export type SkillGroup = { field: string; items: readonly string[] };

export const skills: readonly SkillGroup[] = [
    { field: "Web", items: ["HTML / CSS / JS", "TS / Next.js / Tailwind"] },
    { field: "Game", items: ["Java / Android Studio", "C# / Unity"] },
    { field: "AI", items: ["Python / PyTorch", "Python / TensorFlow / Keras"] },
    { field: "Other", items: ["3D Model / Blender", "Design / Illustrator / Photoshop"] },
] as const;

export type Work = {
    title: string;
    caption: string;
    href: string;
    ready: boolean;
    external?: boolean;
};

export const works: readonly Work[] = [
    {
        title: "Web Sites",
        caption: "制作したWebサイト",
        href: "/portfolio/sites",
        ready: false,
    },
    { title: "Games", caption: "ゲーム制作", href: "/portfolio/games", ready: false },
    { title: "3D Models", caption: "Blenderでのモデリング", href: "/portfolio/models", ready: false },
    { title: "Photos", caption: "撮影した写真", href: "/portfolio/photos", ready: false },
    { title: "GitHub", caption: "ソースコード", href: links.github, ready: true, external: true },
] as const;

/** プロフィール情報。/about でも同じ値を使う */
export const profile = {
    school: "Nagaoka University of Technology",
    schoolShort: "NUT",
    program: "Information & Management Systems Engineering",
    programJa: "情報・経営システム工学",
    hobbies: ["Programming", "Game", "Fashion", "Perfume", "Camera"],
    languages: ["Python", "C", "C++", "C#", "Java", "HTML/CSS", "JS", "TS", "R"],
} as const;
