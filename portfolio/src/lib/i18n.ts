// src/lib/i18n.ts
// 日英の切り替えに関する定数と小さな関数。サーバー・クライアントのどちらからも使う。

/**
 * 対応言語。日本語が既定で、URL に接頭辞を付けない（/home）。
 * 英語は /en を付ける（/en/home）。
 * 内部的には middleware が /home → /ja/home に rewrite し、app/[lang] 配下で描画する。
 */
export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ja";

export const isLocale = (value: unknown): value is Locale =>
    typeof value === "string" && (LOCALES as readonly string[]).includes(value);

/** 言語ごとの文字列。管理画面(CMS)で編集する項目もこの形で持つ */
export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

/**
 * 表示する言語の値を取り出す。
 * 片方しか入力されていない場合はもう片方で埋める（英語が未入力なら日本語を出す）。
 */
export const pick = (value: Localized, lang: Locale): string =>
    value[lang] || value[lang === "ja" ? "en" : "ja"];

export const pickList = (value: LocalizedList, lang: Locale): string[] =>
    value[lang].length > 0 ? value[lang] : value[lang === "ja" ? "en" : "ja"];

/**
 * サイト内パスに言語の接頭辞を付ける。外部URLやクエリ付きのパスもそのまま扱える。
 *   localizePath("/home", "en") → "/en/home"
 *   localizePath("/", "en")     → "/en"
 */
export const localizePath = (path: string, lang: Locale): string => {
    if (lang === DEFAULT_LOCALE || !path.startsWith("/")) return path;
    return path === "/" ? "/en" : `/en${path}`;
};

/**
 * パスから言語の接頭辞を外す。middleware の rewrite 後のパス（/ja/home）にも対応する。
 *   stripLocale("/en/home") → "/home"
 *   stripLocale("/ja")      → "/"
 */
export const stripLocale = (path: string): string => {
    const match = path.match(/^\/(ja|en)(?=\/|$)/);
    if (!match) return path;
    return path.slice(match[0].length) || "/";
};

/** OGP の og:locale に入れる値 */
export const ogLocale: Record<Locale, string> = { ja: "ja_JP", en: "en_US" };

/** メタデータの alternates（hreflang）。検索エンジンに日英の対応関係を伝える */
export const alternatesFor = (path: string, lang: Locale) => ({
    canonical: localizePath(path, lang),
    languages: {
        ja: localizePath(path, "ja"),
        en: localizePath(path, "en"),
        "x-default": localizePath(path, DEFAULT_LOCALE),
    },
});
