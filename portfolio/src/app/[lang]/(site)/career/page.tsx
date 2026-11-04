// src/app/[lang]/(site)/career/page.tsx
import type { Metadata } from "next";
import { CareerTimeline } from "@/components/career/CareerTimeline";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getCareer } from "@/lib/content/getCareer";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale } from "@/lib/i18n";
import { openGraphFor } from "@/lib/metadata";

type Props = { params: { lang: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

export const generateMetadata = ({ params }: Props): Metadata => {
    const lang = langOf(params);
    const t = getDictionary(lang).meta;
    return {
        title: t.career,
        description: t.careerDescription,
        alternates: alternatesFor("/career", lang),
        openGraph: openGraphFor("/career", lang),
    };
};

/**
 * 経歴の年表。項目は登録ファイルから登録スクリプト（scripts/career.ts）で Firestore に書き込む。
 * /about と同じく ISR にし、書き込んでから 5 分ほどで反映する
 */
export const revalidate = 300;

export default async function CareerPage({ params }: Props) {
    const lang = langOf(params);
    const t = getDictionary(lang).career;
    const items = await getCareer();

    return (
        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-24">
            <SectionTitle {...t.heading} as="h1" />
            <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-300">{t.lead}</p>

            {items.length === 0 ? (
                <Panel className="p-10 text-center">
                    <p className="text-sm text-white/50">{t.empty}</p>
                </Panel>
            ) : (
                <CareerTimeline
                    items={items}
                    lang={lang}
                    texts={{ filterLabel: t.filterLabel, all: t.all, kinds: t.kinds, present: t.present, emptyKind: t.emptyKind }}
                />
            )}
        </div>
    );
}
