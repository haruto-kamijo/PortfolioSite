// src/app/[lang]/(site)/catalog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CatalogNav } from "@/components/catalog/CatalogNav";
import { CONCEPT_VIEWS } from "@/components/catalog/concepts";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { CATALOG_CONCEPTS, CATALOG_CONCEPT_IDS } from "@/lib/catalog/concepts";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale, localizePath, pick } from "@/lib/i18n";
import { openGraphFor } from "@/lib/metadata";

type Props = { params: { lang: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

export const generateMetadata = ({ params }: Props): Metadata => {
    const lang = langOf(params);
    const t = getDictionary(lang).meta;
    return {
        title: t.catalog,
        description: t.catalogDescription,
        alternates: alternatesFor("/catalog", lang),
        openGraph: openGraphFor("/catalog", lang),
    };
};

/** デザインカタログの入口。見本のページを、それぞれの見た目のままの小さなカードで並べる */
export default function CatalogPage({ params }: Props) {
    const lang = langOf(params);
    const t = getDictionary(lang).catalog;

    return (
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-24">
            <SectionTitle {...t.heading} as="h1" />
            <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-300">{t.lead}</p>
            <CatalogNav lang={lang} active="pages" />

            <ul className="grid gap-4 sm:grid-cols-2">
                {CATALOG_CONCEPT_IDS.map((id) => {
                    const concept = CATALOG_CONCEPTS[id];
                    const { Frame, samples } = CONCEPT_VIEWS[id];
                    return (
                        <li key={id}>
                            <Link
                                href={localizePath(`/catalog/${id}`, lang)}
                                className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-colors hover:border-cyan-200/40"
                            >
                                {/* そのページの書体と配色で、名前と色見本を出す */}
                                <Frame className="flex h-44 flex-col justify-between p-6">
                                    <p className="text-[11px] tracking-[0.3em] opacity-60">{concept.domain}</p>
                                    <div>
                                        <p className="text-2xl">{pick(concept.name, lang)}</p>
                                        <div className="mt-3 flex gap-1.5" aria-hidden>
                                            {concept.palette.map((color) => (
                                                <span
                                                    key={color}
                                                    className="h-4 w-4 rounded-full border border-black/10"
                                                    style={{ background: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </Frame>
                                <div className="p-5">
                                    <p className="text-[11px] tracking-[0.2em] text-cyan-100/60">
                                        {pick(concept.purpose, lang)} · {pick(concept.style, lang)}
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{pick(concept.summary, lang)}</p>
                                    <p className="mt-4 flex items-center justify-between text-xs text-white/60">
                                        {t.partsCount.replace("{n}", String(Object.keys(samples).length))}
                                        <span className="tracking-wider text-cyan-200/80 transition-transform group-hover:translate-x-1 motion-reduce:transition-none">
                                            {t.open} →
                                        </span>
                                    </p>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
