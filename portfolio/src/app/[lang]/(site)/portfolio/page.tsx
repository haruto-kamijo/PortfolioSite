// src/app/[lang]/(site)/portfolio/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getPortfolioItems } from "@/lib/content/getPortfolioItems";
import {
    PORTFOLIO_CATEGORIES,
    PORTFOLIO_CATEGORY_LABELS,
    PortfolioCategory,
} from "@/lib/content/types";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale, localizePath, pick } from "@/lib/i18n";
import { openGraphFor } from "@/lib/metadata";

type Props = { params: { lang: string }; searchParams: { tab?: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

export const generateMetadata = ({ params }: Props): Metadata => {
    const lang = langOf(params);
    const t = getDictionary(lang).meta;
    return {
        title: t.portfolio,
        description: t.portfolioDescription,
        alternates: alternatesFor("/portfolio", lang),
        openGraph: openGraphFor("/portfolio", lang),
    };
};

/**
 * searchParams(?tab=) を読むため、リクエストごとに描画する。
 * [lang] の generateStaticParams があると Next.js がビルド時に静的生成してしまい、
 * どのタブを開いても最初のタブが出るようになるため、明示的に動的にしている。
 * その代わり home の WORKS カードから該当タブへ直接ディープリンクできる。
 * 個人サイトの規模では毎回 Firestore を読みに行っても負荷上の問題はない。
 */
export const dynamic = "force-dynamic";

const isCategory = (value: string | undefined): value is PortfolioCategory =>
    !!value && (PORTFOLIO_CATEGORIES as readonly string[]).includes(value);

export default async function PortfolioPage({ params, searchParams }: Props) {
    const lang = langOf(params);
    const t = getDictionary(lang).portfolio;
    const items = await getPortfolioItems();
    const category = isCategory(searchParams.tab) ? searchParams.tab : "sites";
    const list = items[category];

    return (
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-24">
            <SectionTitle {...t.heading} />

            {/* タブ。クエリパラメータでの遷移なのでJS無しでも動く */}
            <nav className="mb-8 flex flex-wrap gap-2 sm:mb-10" aria-label={t.tabsLabel}>
                {PORTFOLIO_CATEGORIES.map((c) => {
                    const active = c === category;
                    return (
                        <Link
                            key={c}
                            href={localizePath(`/portfolio?tab=${c}`, lang)}
                            aria-current={active ? "page" : undefined}
                            className={`rounded-full border px-4 py-2 text-xs tracking-widest transition-colors ${
                                active
                                    ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-200"
                                    : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                            }`}
                        >
                            {PORTFOLIO_CATEGORY_LABELS[c][lang]}
                        </Link>
                    );
                })}
            </nav>

            {list.length === 0 ? (
                <Panel className="p-10 text-center">
                    <p className="text-sm text-white/50">{t.empty}</p>
                </Panel>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {list.map((item) => {
                        const caption = pick(item.caption, lang);
                        const body = (
                            <>
                                <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
                                    {item.coverUrl ? (
                                        <Image
                                            src={item.coverUrl}
                                            alt=""
                                            width={400}
                                            height={240}
                                            className="h-full w-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-[11px] text-white/25">{t.noImage}</span>
                                    )}
                                </div>
                                <p className="mt-4 text-base text-white">{pick(item.title, lang)}</p>
                                {caption && <p className="mt-2 text-xs text-slate-400">{caption}</p>}
                            </>
                        );

                        return (
                            <Panel
                                as="li"
                                key={item.id}
                                className={item.href ? "transition-colors hover:border-cyan-200/40" : ""}
                            >
                                {item.href ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-5"
                                    >
                                        {body}
                                    </a>
                                ) : (
                                    <div className="p-5">{body}</div>
                                )}
                            </Panel>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
