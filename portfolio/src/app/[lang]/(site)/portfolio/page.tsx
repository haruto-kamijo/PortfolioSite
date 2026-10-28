// src/app/[lang]/(site)/portfolio/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getFeedItems } from "@/lib/content/feeds";
import { getPortfolioItems } from "@/lib/content/getPortfolioItems";
import {
    PORTFOLIO_CATEGORIES,
    PORTFOLIO_CATEGORY_LABELS,
    PortfolioCategory,
} from "@/lib/content/types";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale, localizePath } from "@/lib/i18n";
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
    // ブログのタブは、手動で登録したカードのあとに RSS の記事を新しい順に並べる
    const list =
        category === "blog"
            ? [...items.blog, ...(await getFeedItems(Object.values(items).flat()))]
            : items[category];

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
                    {list.map((item) => (
                        <PortfolioCard key={item.id} item={item} lang={lang} showDate={category === "blog"} />
                    ))}
                </ul>
            )}
        </div>
    );
}
