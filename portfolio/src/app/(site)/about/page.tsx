// src/app/(site)/about/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { AcademicStatusLine } from "@/components/ui/AcademicStatusLine";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { academicStatusAt } from "@/lib/academicYear";
import { getSiteContent } from "@/lib/content/getSiteContent";

export const metadata: Metadata = {
    title: "About",
    description: "上條遥都のプロフィール。所属・スキル・趣味など。",
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

export default async function AboutPage() {
    const { profile } = await getSiteContent();

    return (
        <div className="mx-auto max-w-4xl px-5 py-16 sm:py-24">
            <SectionTitle en="ABOUT" ja="プロフィール" />

            <Panel className="flex flex-col gap-8 p-8 sm:flex-row sm:items-start sm:p-10">
                <Image
                    src="/my_image1.jpg"
                    alt={profile.name}
                    width={200}
                    height={240}
                    className="h-60 w-48 shrink-0 rounded-xl object-cover"
                    priority
                />

                <div>
                    <h1 className="text-2xl text-white sm:text-3xl">{profile.name}</h1>
                    <p className="mt-1 text-base text-white/70">{profile.nameJa}</p>
                    <p className="mt-4 text-sm tracking-[0.14em] text-slate-300">{profile.role}</p>

                    <AcademicStatusLine
                        initial={academicStatusAt(new Date())}
                        schoolShort={profile.schoolShort}
                        program={profile.program}
                        gradeOverride={profile.gradeOverride}
                    />

                    <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-200">
                        {profile.tagline}
                    </p>
                </div>
            </Panel>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Panel className="p-6">
                    <p className="text-sm tracking-[0.24em] text-cyan-200/80">SCHOOL</p>
                    <p className="mt-4 text-sm text-slate-200">{profile.school}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        {profile.program}
                        <span className="mx-1.5 text-white/20">/</span>
                        {profile.programJa}
                    </p>
                </Panel>

                <Panel className="p-6">
                    <p className="text-sm tracking-[0.24em] text-cyan-200/80">HOBBY</p>
                    <div className="mt-4">
                        <TagList items={profile.hobbies} />
                    </div>
                </Panel>

                <Panel className="p-6 sm:col-span-2">
                    <p className="text-sm tracking-[0.24em] text-cyan-200/80">LANGUAGE</p>
                    <div className="mt-4">
                        <TagList items={profile.languages} />
                    </div>
                </Panel>
            </div>
        </div>
    );
}
