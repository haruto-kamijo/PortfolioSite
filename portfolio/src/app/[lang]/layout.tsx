// src/app/[lang]/layout.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HtmlLang } from "@/components/i18n/HtmlLang";
import { getDictionary } from "@/lib/dictionary";
import { LOCALES, alternatesFor, isLocale, localizePath, ogLocale } from "@/lib/i18n";
import { site } from "@/lib/site";

/**
 * 公開ページ共通の言語レイアウト。
 *
 * 日本語は /home、英語は /en/home で配信する。日本語の URL は middleware が
 * /ja/home に rewrite してからここに届くため、[lang] には必ず ja か en が入る。
 * それ以外の値（/__not_found__ など）は dynamicParams = false により通常の 404 になる。
 */
export const dynamicParams = false;

export const generateStaticParams = () => LOCALES.map((lang) => ({ lang }));

export const generateMetadata = ({ params }: { params: { lang: string } }): Metadata => {
    if (!isLocale(params.lang)) return {};
    const lang = params.lang;
    const t = getDictionary(lang);
    const title = `${site.name} | ${t.meta.siteTitle}`;

    return {
        // absolute にしないと、ルートレイアウトの template が重なり名前が2回付く
        title: { absolute: title, template: `%s | ${site.name}` },
        description: site.description[lang],
        alternates: alternatesFor("/", lang),
        openGraph: {
            type: "website",
            locale: ogLocale[lang],
            alternateLocale: LOCALES.filter((l) => l !== lang).map((l) => ogLocale[l]),
            siteName: `${site.name} Portfolio`,
            title,
            description: site.description[lang],
            url: localizePath("/", lang),
        },
    };
};

export default function LangLayout({
                                       children,
                                       params,
                                   }: {
    children: React.ReactNode;
    params: { lang: string };
}) {
    if (!isLocale(params.lang)) notFound();

    return (
        // contents にしておくと、このラッパーがレイアウト（flex や min-h）に影響しない
        <div lang={params.lang} className="contents">
            <HtmlLang lang={params.lang} />
            {children}
        </div>
    );
}
