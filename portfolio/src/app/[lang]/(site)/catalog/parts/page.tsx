// src/app/[lang]/(site)/catalog/parts/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CatalogNav } from "@/components/catalog/CatalogNav";
import { CONCEPT_VIEWS } from "@/components/catalog/concepts";
import { HashHighlight } from "@/components/catalog/HashHighlight";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CATALOG_CONCEPTS, CATALOG_CONCEPT_IDS } from "@/lib/catalog/concepts";
import { CATALOG_PARTS, CATALOG_PART_IDS, CatalogPartId } from "@/lib/catalog/parts";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale, localizePath, pick, pickList } from "@/lib/i18n";
import { openGraphFor } from "@/lib/metadata";

type Props = { params: { lang: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

export const generateMetadata = ({ params }: Props): Metadata => {
    const lang = langOf(params);
    const t = getDictionary(lang).meta;
    return {
        title: `${t.catalogParts} | ${t.catalog}`,
        description: t.catalogPartsDescription,
        alternates: alternatesFor("/catalog/parts", lang),
        openGraph: openGraphFor("/catalog/parts", lang),
    };
};

/** 横幅が要るパーツ。これ以外は見本を2列に並べる */
const WIDE_PARTS = new Set<CatalogPartId>([
    "global-nav",
    "hero",
    "ticker",
    "feature-grid",
    "menu-list",
    "pricing-table",
    "gallery",
    "accordion",
    "form",
    "footer",
]);

/**
 * パーツ図鑑。パーツごとに名前・別名・役割と、そのパーツを使っている見本のページでの見え方を並べる。
 * 見本のページでパーツを押すと #<パーツの id> 付きでここに来るので、その項目を枠で目立たせる（HashHighlight）
 */
export default function CatalogPartsPage({ params }: Props) {
    const lang = langOf(params);
    const t = getDictionary(lang).catalog;

    return (
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-24">
            <SectionTitle {...t.partsHeading} as="h1" />
            <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-300">{t.partsLead}</p>
            <CatalogNav lang={lang} active="parts" />
            <HashHighlight />

            <nav aria-label={t.partsIndexLabel} className="mb-12">
                <ul className="flex flex-wrap gap-2">
                    {CATALOG_PART_IDS.map((id) => (
                        <li key={id}>
                            <a
                                href={`#${id}`}
                                className="block rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-cyan-200/40 hover:text-cyan-200"
                            >
                                {pick(CATALOG_PARTS[id].name, lang)}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="space-y-6">
                {CATALOG_PART_IDS.map((id) => {
                    const part = CATALOG_PARTS[id];
                    const usedIn = CATALOG_CONCEPT_IDS.filter((c) => CONCEPT_VIEWS[c].samples[id]);
                    return (
                        <section
                            key={id}
                            id={id}
                            // 固定ヘッダーの下に隠れないように、飛んできたときは少し下で止める
                            className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-shadow data-[highlight]:border-cyan-200/60 data-[highlight]:shadow-[0_0_40px_rgba(103,232,249,0.15)] sm:p-8"
                        >
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <h2 className="text-lg text-white">{pick(part.name, lang)}</h2>
                                {lang === "ja" && <span className="text-xs tracking-wider text-cyan-100/50">{part.name.en}</span>}
                            </div>
                            <p className="mt-1 text-[11px] text-white/40">
                                {t.aliases}
                                {pickList(part.aliases, lang).join(" / ")}
                            </p>
                            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300">{pick(part.description, lang)}</p>

                            <p className="mb-3 mt-6 text-xs tracking-[0.2em] text-cyan-100/60">{t.usedIn}</p>
                            <ul className={`grid grid-cols-[minmax(0,1fr)] gap-4 ${WIDE_PARTS.has(id) ? "" : "md:grid-cols-2"}`}>
                                {usedIn.map((c) => {
                                    const { Frame, samples } = CONCEPT_VIEWS[c];
                                    const Sample = samples[id]!;
                                    const concept = CATALOG_CONCEPTS[c];
                                    return (
                                        <li key={c}>
                                            <Panel as="article" className="overflow-hidden">
                                                <div
                                                    role="img"
                                                    aria-label={`${pick(concept.name, lang)} — ${pick(part.name, lang)}`}
                                                    className="overflow-hidden border-b border-white/10"
                                                    // 見本の中のボタンや入力欄は、見本のページで動かすもの。ここでは絵として見せ、押せないようにする
                                                    // （React 18 は inert を属性として扱わず、true では出力されないので、空の文字列で渡す）
                                                    {...({ inert: "" } as object)}
                                                >
                                                    <Frame>
                                                        <Sample lang={lang} />
                                                    </Frame>
                                                </div>
                                                <p className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs">
                                                    <span className="text-slate-300">
                                                        {pick(concept.name, lang)}
                                                        <span className="ml-2 text-white/40">{pick(concept.style, lang)}</span>
                                                    </span>
                                                    <Link
                                                        href={localizePath(`/catalog/${c}?part=${id}`, lang)}
                                                        className="tracking-wider text-cyan-200/80 hover:text-cyan-200"
                                                    >
                                                        {t.viewOnPage} →
                                                    </Link>
                                                </p>
                                            </Panel>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
