// src/app/[lang]/(site)/portfolio/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CATALOG_PORTFOLIO_ITEM } from "@/lib/catalog/portfolioItem";
import { getFeedItems } from "@/lib/content/feeds";
import { getPortfolioItems } from "@/lib/content/getPortfolioItems";
import {
    MAX_SELECTED_TAGS,
    countTags,
    hasAllTags,
    readSelectedTags,
    tagsHref,
    toggleTagHref,
} from "@/lib/content/tags";
import {
    PORTFOLIO_CATEGORIES,
    PORTFOLIO_CATEGORY_LABELS,
    PortfolioCategory,
} from "@/lib/content/types";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale, localizePath } from "@/lib/i18n";
import { openGraphFor } from "@/lib/metadata";

type Props = { params: { lang: string }; searchParams: { tab?: string; tag?: string | string[] } };

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
 * searchParams(?tab= と ?tag=) を読むため、リクエストごとに描画する。
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
    // タグの一覧はすべてのカテゴリの作品から作るので、どのタブでも RSS の記事を読む（RSS は1時間キャッシュしている）
    const feedItems = await getFeedItems(Object.values(items).flat());
    // ブログのタブは、手動で登録したカードのあとに RSS の記事を新しい順に並べる。
    // Webサイトのタブは、コードに置いたデザインカタログのカードを先頭に出す
    const itemsOf = (c: PortfolioCategory) =>
        c === "blog" ? [...items.blog, ...feedItems] : c === "sites" ? [CATALOG_PORTFOLIO_ITEM, ...items.sites] : items[c];
    const all = PORTFOLIO_CATEGORIES.flatMap(itemsOf);

    // タグを選んでいる間は、タブに関係なく、選んだタグを全部持つ作品をカテゴリの順に並べる
    const selected = readSelectedTags(searchParams.tag);
    const filtering = selected.length > 0;
    const category = isCategory(searchParams.tab) ? searchParams.tab : "sites";
    const list = filtering ? all.filter((item) => hasAllTags(item, selected)) : itemsOf(category);
    // 足せるタグは、今の結果に付いているものだけにする（足しても0件にならないように）
    const available = countTags(filtering ? list : all).filter(({ tag }) => !selected.includes(tag));
    const full = selected.length >= MAX_SELECTED_TAGS;
    const chip = "rounded-full border px-3 py-1.5 text-[11px] tracking-wider transition-colors";

    return (
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-24">
            <SectionTitle {...t.heading} />

            {/* タブ。クエリパラメータでの遷移なのでJS無しでも動く。タブを押すとタグの絞り込みは外れる */}
            <nav className="mb-6 flex flex-wrap gap-2" aria-label={t.tabsLabel}>
                {PORTFOLIO_CATEGORIES.map((c) => {
                    const active = !filtering && c === category;
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

            {/* タグでの絞り込み。タブと同じくリンクで切り替える */}
            {(filtering || available.length > 0) && (
                <section className="mb-8 sm:mb-10" aria-labelledby="tag-filter-heading">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h2 id="tag-filter-heading" className="text-xs tracking-widest text-white/70">
                            {t.tagFilterLabel}
                        </h2>
                        <p className="text-[11px] text-white/40">{t.tagFilterHint}</p>
                    </div>
                    {filtering && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {selected.map((tag) => (
                                <Link
                                    key={tag}
                                    href={toggleTagHref(selected, tag, lang)}
                                    aria-label={t.tagRemove.replace("{tag}", tag)}
                                    aria-current="true"
                                    className={`${chip} border-cyan-200/50 bg-cyan-200/10 text-cyan-200 hover:border-cyan-200/80`}
                                >
                                    {tag} <span aria-hidden="true">×</span>
                                </Link>
                            ))}
                            <Link
                                href={tagsHref([], lang)}
                                className="px-2 py-1.5 text-[11px] tracking-wider text-white/50 underline-offset-4 hover:text-white hover:underline"
                            >
                                {t.tagClear}
                            </Link>
                        </div>
                    )}
                    {available.length > 0 && (
                        <ul className="mt-3 flex flex-wrap gap-2">
                            {available.map(({ tag, count }) => (
                                <li key={tag} className="flex">
                                    {/* 選べる数を超えるタグは足せないので、押せない見た目のまま出す */}
                                    {full ? (
                                        <span className={`${chip} border-white/10 text-white/30`}>
                                            {tag} <span className="text-white/25">{count}</span>
                                        </span>
                                    ) : (
                                        <Link
                                            href={toggleTagHref(selected, tag, lang)}
                                            aria-label={`${t.tagAdd.replace("{tag}", tag)} (${count})`}
                                            className={`${chip} border-white/15 text-white/60 hover:border-white/35 hover:text-white`}
                                        >
                                            {tag} <span className="text-white/35">{count}</span>
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {full && (
                        <p className="mt-2 text-[11px] text-white/40">
                            {t.tagFilterFull.replace("{max}", String(MAX_SELECTED_TAGS))}
                        </p>
                    )}
                </section>
            )}

            {filtering && (
                <p className="mb-4 text-sm text-white/70">
                    {t.tagResults
                        .replace("{tags}", selected.map((tag) => (lang === "ja" ? `「${tag}」` : tag)).join(lang === "ja" ? "" : ", "))
                        .replace("{n}", String(list.length))}
                </p>
            )}

            {list.length === 0 ? (
                <Panel className="p-10 text-center">
                    <p className="text-sm text-white/50">{filtering ? t.tagEmpty : t.empty}</p>
                    {filtering && (
                        <Link
                            href={tagsHref([], lang)}
                            className="mt-4 inline-block text-xs tracking-wider text-cyan-200 underline-offset-4 hover:underline"
                        >
                            {t.tagClear}
                        </Link>
                    )}
                </Panel>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {list.map((item) => (
                        <PortfolioCard
                            key={item.id}
                            item={item}
                            lang={lang}
                            showDate={(filtering ? item.category : category) === "blog"}
                            showCategory={filtering}
                            selectedTags={selected}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}
