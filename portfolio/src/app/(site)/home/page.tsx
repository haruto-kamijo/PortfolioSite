// src/app/(site)/home/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { AcademicStatusLine } from "@/components/ui/AcademicStatusLine";
import { academicStatusAt } from "@/lib/academicYear";
import { getSiteContent } from "@/lib/content/getSiteContent";
import { links, site } from "@/lib/site";

export const metadata: Metadata = {
    title: "Home",
    description: site.description,
};

/**
 * 管理画面(CMS)で更新した内容を再デプロイなしで反映させるため ISR にしている。
 * CMS の保存処理を作る段階で revalidatePath による即時反映も足す。
 */
export const revalidate = 300;

export default async function HomePage() {
    const { profile, skillGroups, works } = await getSiteContent();

    return (
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
            {/* Hero */}
            <section className="mb-24">
                <p className="text-[11px] tracking-[0.4em] text-cyan-100/60">PORTFOLIO SITE</p>
                <h1 className="mt-5 text-3xl leading-tight text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.25)] sm:text-5xl">
                    {profile.name}
                    <span className="mt-2 block text-lg text-white/70 sm:text-2xl">
                        {profile.nameJa}
                    </span>
                </h1>
                <p className="mt-5 text-sm tracking-[0.16em] text-slate-300 sm:text-base">
                    {profile.role}
                </p>
                <AcademicStatusLine
                    initial={academicStatusAt(new Date())}
                    schoolShort={profile.schoolShort}
                    program={profile.program}
                    gradeOverride={profile.gradeOverride}
                />
                <p className="mt-8 max-w-xl text-slate-200">{profile.tagline}</p>

                <div className="mt-10 flex flex-wrap gap-3">
                    <a
                        href={links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-cyan-200/30 px-6 py-2 text-xs tracking-widest text-white shadow-[0_0_20px_rgba(120,255,255,0.2)] transition-shadow hover:shadow-[0_0_30px_rgba(120,255,255,0.4)]"
                    >
                        GITHUB
                    </a>
                    <a
                        href={links.note}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-white/20 px-6 py-2 text-xs tracking-widest text-white/80 transition-colors hover:border-white/40 hover:text-white"
                    >
                        BLOG
                    </a>
                </div>
            </section>

            {/* Skills */}
            <section className="mb-24">
                <SectionTitle en="SKILLS" ja="使える技術" />
                <ul className="grid gap-4 sm:grid-cols-2">
                    {skillGroups.map((group) => (
                        <Panel as="li" key={group.id} className="p-6">
                            <p className="text-sm tracking-[0.24em] text-cyan-200/80">{group.field}</p>
                            <ul className="mt-4 space-y-2">
                                {group.items.map((item) => (
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
            <section className="mb-24">
                <SectionTitle en="WORKS" ja="制作物" />
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {works.map((work) => {
                        const body = (
                            <>
                                <p className="text-base text-white">{work.title}</p>
                                <p className="mt-2 text-xs text-slate-400">{work.caption}</p>
                                <p className="mt-6 text-[10px] tracking-[0.2em] text-cyan-100/60">
                                    {work.ready ? "VIEW" : "COMING SOON"}
                                </p>
                            </>
                        );

                        // ページ未実装のカテゴリはリンクにせず、準備中として見せる
                        if (!work.ready) {
                            return (
                                <Panel as="li" key={work.id} className="p-6 opacity-50">
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
                                        className="block p-6"
                                    >
                                        {body}
                                    </a>
                                ) : (
                                    <Link href={work.href} className="block p-6">
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
                <SectionTitle en="CONTACT" ja="お問い合わせ" />
                <Panel className="flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-300">
                        制作のご相談・ご依頼はお問い合わせフォームからお願いします。
                    </p>
                    <Link
                        href="/contact"
                        className="shrink-0 rounded-full border border-cyan-200/30 px-6 py-2 text-xs tracking-widest text-white shadow-[0_0_20px_rgba(120,255,255,0.2)] transition-shadow hover:shadow-[0_0_30px_rgba(120,255,255,0.4)]"
                    >
                        CONTACT
                    </Link>
                </Panel>
            </section>
        </div>
    );
}
