// src/components/layout/LanguageSwitch.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { getDictionary } from "@/lib/dictionary";
import { Locale, localizePath, stripLocale } from "@/lib/i18n";

const className =
    "rounded-full border border-white/20 px-3 py-1.5 text-[11px] tracking-[0.2em] text-white/80 transition-colors hover:border-cyan-200/50 hover:text-cyan-200";

/**
 * 日英の切り替えボタン。今いるページの、もう一方の言語版へ移動する。
 * /portfolio?tab=games のようなクエリも引き継ぐ。
 *
 * useSearchParams は静的に描画するページでは Suspense の内側でしか使えないため、
 * Header 側で <Suspense fallback={<LanguageSwitchFallback />}> に包んで使う。
 */
export const LanguageSwitch = ({ lang, onNavigate }: { lang: Locale; onNavigate?: () => void }) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const query = searchParams.toString();
    return <SwitchLink lang={lang} path={stripLocale(pathname)} query={query} onNavigate={onNavigate} />;
};

/** クエリが読めるまでの代わり。リンク先はクエリなしで同じページ */
export const LanguageSwitchFallback = ({ lang }: { lang: Locale }) => {
    const pathname = usePathname();
    return <SwitchLink lang={lang} path={stripLocale(pathname)} query="" />;
};

const SwitchLink = ({
                        lang,
                        path,
                        query,
                        onNavigate,
                    }: {
    lang: Locale;
    path: string;
    query: string;
    onNavigate?: () => void;
}) => {
    const other: Locale = lang === "ja" ? "en" : "ja";
    const t = getDictionary(lang).header;
    const href = localizePath(path, other) + (query ? `?${query}` : "");

    return (
        <Link href={href} hrefLang={other} aria-label={t.switchLabel} onClick={onNavigate} className={className}>
            {t.switchTo}
        </Link>
    );
};
