// src/app/[lang]/(site)/home/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AcademicStatusLine } from "@/components/ui/AcademicStatusLine";
import { academicStatusAt } from "@/lib/academicYear";
import { getSiteContent } from "@/lib/content/getSiteContent";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale, localizePath, pick, pickList } from "@/lib/i18n";
import { openGraphFor } from "@/lib/metadata";
import { links, site } from "@/lib/site";

type Props = { params: { lang: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

export const generateMetadata = ({ params }: Props): Metadata => {
    const lang = langOf(params);
    return {
        title: getDictionary(lang).meta.home,
        description: site.description[lang],
        alternates: alternatesFor("/home", lang),
        openGraph: openGraphFor("/home", lang),
    };
};

/**
 * 管理画面(CMS)で更新した内容を再デプロイなしで反映させるため ISR にしている。
 * CMS の保存時には revalidatePath でも即時反映する。
 */
export const revalidate = 300;

export default async function HomePage({ params }: Props) {
    const lang = langOf(params);
    const t = getDictionary(lang);
    const { profile, skillGroups, works } = await getSiteContent();

    // 表示中の言語の名前を大きく、もう一方を添える
    const otherLang = lang === "ja" ? "en" : "ja";

    return (
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-24">
            {/* Hero */}
            <section className="mb-16 sm:mb-24">
                <p className="text-[11px] tracking-[0.4em] text-cyan-100/60">{t.home.kicker}</p>
                <h1 className="mt-5 text-3xl leading-tight text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.25)] sm:text-5xl">
                    {pick(profile.name, lang)}
                    <span className="mt-2 block text-lg text-white/70 sm:text-2xl">
                        {pick(profile.name, otherLang)}
                    </span>
                </h1>
                <p className="mt-5 text-sm tracking-[0.16em] text-slate-300 sm:text-base">
                    {pick(profile.role, lang)}
                </p>
                <AcademicStatusLine
                    initial={academicStatusAt(new Date())}
                    schoolShort={pick(profile.schoolShort, lang)}
                    program={pick(profile.program, lang)}
                    gradeOverride={profile.gradeOverride}
                    graduatedLabel={t.academic.graduated}
                />
                <p className="mt-8 max-w-xl text-slate-200">{pick(profile.tagline, lang)}</p>

                <div className="mt-10 flex flex-wrap gap-3">
                    <a
                        href={links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-cyan-200/30 px-6 py-2.5 text-xs tracking-widest text-white shadow-[0_0_20px_rgba(120,255,255,0.2)] transition-shadow hover:shadow-[0_0_30px_rgba(120,255,255,0.4)]"
                    >
                        {t.home.github}
                    </a>
                    <a
                        href={links.note}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/20 px-6 py-2.5 text-xs tracking-widest text-white/80 transition-colors hover:border-white/40 hover:text-white"
                    >
                        {t.home.blog}
                    </a>
                </div>
            </section>

            {/* Skills */}
            <section className="mb-16 sm:mb-24">
                <SectionTitle {...t.home.skills} />
                <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    {skillGroups.map((group) => (
                        <Panel as="li" key={group.id} className="p-5 sm:p-6">
                            <p className="text-sm tracking-[0.24em] text-cyan-200/80">{pick(group.field, lang)}</p>
                            <ul className="mt-3 space-y-2 sm:mt-4">
                                {pickList(group.items, lang).map((item) => (
                                    <li key={item} className="text-sm text-slate-200">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ))}
                </ul>
            </section>

            {/* Works */}
            <section className="mb-16 sm:mb-24">
                <SectionTitle {...t.home.works} />
                {/* スマホでも2列にして、縦に長くなりすぎないようにする */}
                <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                    {works.map((work) => {
                        const body = (
                            <>
                                <p className="text-sm text-white sm:text-base">{pick(work.title, lang)}</p>
                                <p className="mt-2 text-xs text-slate-400">{pick(work.caption, lang)}</p>
                                <p className="mt-4 text-[10px] tracking-[0.2em] text-cyan-100/60 sm:mt-6">
                                    {work.ready ? t.home.view : t.home.comingSoon}
                                </p>
                            </>
                        );

                        // ページ未実装のカテゴリはリンクにせず、準備中として見せる
                        if (!work.ready) {
                            return (
                                <Panel as="li" key={work.id} className="p-4 opacity-50 sm:p-6">
                                    {body}
                                </Panel>
                            );
                        }

                        return (
                            <Panel
                                as="li"
                                key={work.id}
                                className="transition-colors hover:border-cyan-200/40"
                            >
                                {work.external ? (
                                    <a
                                        href={work.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block h-full p-4 sm:p-6"
                                    >
                                        {body}
                                    </a>
                                ) : (
                                    <Link href={localizePath(work.href, lang)} className="block h-full p-4 sm:p-6">
                                        {body}
                                    </Link>
                                )}
                            </Panel>
                        );
                    })}
                </ul>
            </section>

            {/* Contact */}
            <section>
                <SectionTitle {...t.home.contact} />
                <Panel className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <p className="text-sm text-slate-300">{t.home.contactLead}</p>
                    <Link
                        href={localizePath("/contact", lang)}
                        className="shrink-0 rounded-full border border-cyan-200/30 px-6 py-2.5 text-xs tracking-widest text-white shadow-[0_0_20px_rgba(120,255,255,0.2)] transition-shadow hover:shadow-[0_0_30px_rgba(120,255,255,0.4)]"
                    >
                        {t.home.contactButton}
                    </Link>
                </Panel>
            </section>
        </div>
    );
}
