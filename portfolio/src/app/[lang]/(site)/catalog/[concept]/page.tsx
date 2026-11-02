// src/app/[lang]/(site)/catalog/[concept]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogNav } from "@/components/catalog/CatalogNav";
import { CatalogViewer } from "@/components/catalog/CatalogViewer";
import { CONCEPT_VIEWS } from "@/components/catalog/concepts";
import { CATALOG_CONCEPTS, CATALOG_CONCEPT_IDS, isCatalogConceptId } from "@/lib/catalog/concepts";
import { CATALOG_PARTS, CatalogPartId } from "@/lib/catalog/parts";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale, localizePath, pick } from "@/lib/i18n";
import { openGraphFor } from "@/lib/metadata";

type Props = { params: { lang: string; concept: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

/** 見本のページは決まった4つだけ。それ以外の名前は 404 にする */
export const dynamicParams = false;

export const generateStaticParams = () => CATALOG_CONCEPT_IDS.map((concept) => ({ concept }));

export const generateMetadata = ({ params }: Props): Metadata => {
    if (!isCatalogConceptId(params.concept)) return {};
    const lang = langOf(params);
    const concept = CATALOG_CONCEPTS[params.concept];
    const path = `/catalog/${params.concept}`;
    return {
        title: `${pick(concept.name, lang)}${lang === "ja" ? `（${pick(concept.style, lang)}）` : ` (${pick(concept.style, lang)})`} | ${getDictionary(lang).meta.catalog}`,
        description: pick(concept.summary, lang),
        alternates: alternatesFor(path, lang),
        openGraph: openGraphFor(path, lang),
    };
};

export default function CatalogConceptPage({ params }: Props) {
    if (!isCatalogConceptId(params.concept)) notFound();
    const id = params.concept;
    const lang = langOf(params);
    const t = getDictionary(lang).catalog;
    const concept = CATALOG_CONCEPTS[id];
    const { Page, samples } = CONCEPT_VIEWS[id];

    // 横の一覧と、ページの中の名前の吹き出しに出す文言。英語のページでは英語名だけにする
    const parts = (Object.keys(samples) as CatalogPartId[]).map((partId) => ({
        id: partId,
        name: pick(CATALOG_PARTS[partId].name, lang),
        sub: lang === "ja" ? CATALOG_PARTS[partId].name.en : "",
        href: localizePath(`/catalog/parts#${partId}`, lang),
    }));

    const index = CATALOG_CONCEPT_IDS.indexOf(id);
    const prev = CATALOG_CONCEPT_IDS[(index - 1 + CATALOG_CONCEPT_IDS.length) % CATALOG_CONCEPT_IDS.length];
    const next = CATALOG_CONCEPT_IDS[(index + 1) % CATALOG_CONCEPT_IDS.length];

    const facts = [
        { label: t.purpose, value: pick(concept.purpose, lang) },
        { label: t.style, value: pick(concept.style, lang) },
        { label: t.font, value: pick(concept.font, lang) },
    ];

    return (
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-24">
            <CatalogNav lang={lang} active="pages" />

            <Link href={localizePath("/catalog", lang)} className="text-xs tracking-wider text-white/50 hover:text-cyan-200">
                ← {t.back}
            </Link>
            <h1 className="mt-4 text-2xl text-white sm:text-3xl">{pick(concept.name, lang)}</h1>
            <p className="mt-1 text-[11px] tracking-wider text-white/40">{t.fictional}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">{pick(concept.summary, lang)}</p>

            <dl className="mb-10 mt-6 flex flex-wrap gap-x-8 gap-y-3 text-xs">
                {facts.map((f) => (
                    <div key={f.label}>
                        <dt className="tracking-[0.2em] text-cyan-100/60">{f.label}</dt>
                        <dd className="mt-1 text-slate-200">{f.value}</dd>
                    </div>
                ))}
                <div>
                    <dt className="tracking-[0.2em] text-cyan-100/60">{t.palette}</dt>
                    <dd className="mt-1 flex gap-2">
                        {concept.palette.map((color) => (
                            <span key={color} className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                                <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ background: color }} />
                                {color}
                            </span>
                        ))}
                    </dd>
                </div>
            </dl>

            <CatalogViewer
                domain={concept.domain}
                parts={parts}
                texts={{
                    previewLabel: t.previewLabel.replace("{name}", pick(concept.name, lang)),
                    hintPointer: t.hintPointer,
                    hintTouch: t.hintTouch,
                    partsOnPage: t.partsOnPage,
                    openInParts: t.openInParts,
                }}
            >
                <Page lang={lang} />
            </CatalogViewer>

            <nav className="mt-12 flex justify-between gap-4 text-xs tracking-wider">
                <Link href={localizePath(`/catalog/${prev}`, lang)} className="text-white/60 hover:text-cyan-200">
                    ← {t.prev}
                    {pick(CATALOG_CONCEPTS[prev].name, lang)}
                </Link>
                <Link href={localizePath(`/catalog/${next}`, lang)} className="text-right text-white/60 hover:text-cyan-200">
                    {t.next}
                    {pick(CATALOG_CONCEPTS[next].name, lang)} →
                </Link>
            </nav>
        </div>
    );
}
