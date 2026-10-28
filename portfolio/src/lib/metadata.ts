// src/lib/metadata.ts

import type { Metadata } from "next";
import { getDictionary } from "@/lib/dictionary";
import { LOCALES, Locale, localizePath, ogLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

/**
 * 公開ページの OGP。path にはそのページの日本語版のパスを渡す。
 * 子ページが openGraph を書かないとレイアウトの値（url が言語のトップ）がそのまま使われるため、
 * 各ページの generateMetadata でも自分のパスでこれを呼ぶ。
 */
export const openGraphFor = (path: string, lang: Locale): NonNullable<Metadata["openGraph"]> => ({
    type: "website",
    locale: ogLocale[lang],
    alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => ogLocale[l]),
    siteName: `${site.name} Portfolio`,
    title: `${site.name} | ${getDictionary(lang).meta.siteTitle}`,
    description: site.description[lang],
    url: localizePath(path, lang),
});
