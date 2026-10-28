// src/app/[lang]/(site)/about/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { AcademicStatusLine } from "@/components/ui/AcademicStatusLine";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { academicStatusAt } from "@/lib/academicYear";
import { getSiteContent } from "@/lib/content/getSiteContent";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale, pick, pickList } from "@/lib/i18n";
import { openGraphFor } from "@/lib/metadata";

type Props = { params: { lang: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

export const generateMetadata = ({ params }: Props): Metadata => {
    const lang = langOf(params);
    const t = getDictionary(lang).meta;
    return {
        title: t.about,
        description: t.aboutDescription,
        alternates: alternatesFor("/about", lang),
        openGraph: openGraphFor("/about", lang),
    };
};

/** /home と同じく ISR。CMS の保存時に revalidatePath でも即時反映する */
export const revalidate = 300;

const TagList = ({ items }: { items: string[] }) => (
    <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
            <li
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-200"
            >
                {item}
            </li>
        ))}
    </ul>
);

export default async function AboutPage({ params }: Props) {
    const lang = langOf(params);
    const otherLang = lang === "ja" ? "en" : "ja";
    const t = getDictionary(lang);
    const { profile } = await getSiteContent();

    return (
        <div className="mx-auto max-w-4xl px-5 py-12 sm:py-24">
            <SectionTitle {...t.about.heading} />

            {/* スマホでは写真を上に中央寄せで置き、文章はその下に左寄せで続ける */}
            <Panel className="flex flex-col gap-8 p-6 sm:flex-row sm:items-start sm:p-10">
                <Image
                    src="/my_image1.jpg"
                    alt={pick(profile.name, lang)}
                    width={200}
                    height={240}
                    className="mx-auto h-60 w-48 shrink-0 rounded-xl object-cover sm:mx-0"
                    priority
                />

                <div>
                    <h1 className="text-2xl text-white sm:text-3xl">{pick(profile.name, lang)}</h1>
                    <p className="mt-1 text-base text-white/70">{pick(profile.name, otherLang)}</p>
                    <p className="mt-4 text-sm tracking-[0.14em] text-slate-300">{pick(profile.role, lang)}</p>

                    <AcademicStatusLine
                        initial={academicStatusAt(new Date())}
                        schoolShort={pick(profile.schoolShort, lang)}
                        program={pick(profile.program, lang)}
                        gradeOverride={profile.gradeOverride}
                        graduatedLabel={t.academic.graduated}
                    />

                    <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-200">
                        {pick(profile.tagline, lang)}
                    </p>
                </div>
            </Panel>

            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
                <Panel className="p-6">
                    <p className="text-sm tracking-[0.24em] text-cyan-200/80">{t.about.school}</p>
                    <p className="mt-4 text-sm text-slate-200">{pick(profile.school, lang)}</p>
                    <p className="mt-1 text-xs text-slate-400">{pick(profile.program, lang)}</p>
                </Panel>

                <Panel className="p-6">
                    <p className="text-sm tracking-[0.24em] text-cyan-200/80">{t.about.hobby}</p>
                    <div className="mt-4">
                        <TagList items={pickList(profile.hobbies, lang)} />
                    </div>
                </Panel>

                <Panel className="p-6 sm:col-span-2">
                    <p className="text-sm tracking-[0.24em] text-cyan-200/80">{t.about.language}</p>
                    <div className="mt-4">
                        <TagList items={profile.languages} />
                    </div>
                </Panel>
            </div>
        </div>
    );
}
