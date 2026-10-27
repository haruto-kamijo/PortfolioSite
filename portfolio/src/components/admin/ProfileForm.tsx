// src/components/admin/ProfileForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Panel } from "@/components/ui/Panel";
import { LocalizedField, adminFieldClass, adminLabelClass } from "@/components/admin/LocalizedField";
import { ProfileContent } from "@/lib/content/types";
import { academicStatusAt } from "@/lib/academicYear";
import { Localized } from "@/lib/i18n";
import { saveProfile } from "@/app/admin/profile/actions";

type TextKey = "name" | "role" | "tagline" | "school" | "schoolShort" | "program";

type Field = { key: TextKey; label: string; placeholder?: Localized };

const BASIC_FIELDS: Field[] = [
    { key: "name", label: "名前", placeholder: { ja: "上條 遥都", en: "Kamijo Haruto" } },
    { key: "role", label: "肩書き" },
    { key: "tagline", label: "キャッチコピー" },
];

const SCHOOL_FIELDS: Field[] = [
    { key: "school", label: "学校名" },
    { key: "schoolShort", label: "学校名（略称）", placeholder: { ja: "長岡技大", en: "NUT" } },
    { key: "program", label: "専攻" },
];

const toLines = (items: string[]) => items.join("\n");

/**
 * プロフィールの編集フォーム。
 * 文章の項目は日本語と英語を並べて入力する。英語が空欄の項目は、英語ページでも日本語で表示される。
 */
export const ProfileForm = ({ initial }: { initial: ProfileContent }) => {
    const [texts, setTexts] = useState<Record<TextKey | "description", Localized>>({
        name: initial.name,
        role: initial.role,
        tagline: initial.tagline,
        description: initial.description,
        school: initial.school,
        schoolShort: initial.schoolShort,
        program: initial.program,
    });
    const [gradeOverride, setGradeOverride] = useState(initial.gradeOverride ?? "");
    const [hobbiesText, setHobbiesText] = useState<Localized>({
        ja: toLines(initial.hobbies.ja),
        en: toLines(initial.hobbies.en),
    });
    const [languagesText, setLanguagesText] = useState(toLines(initial.languages));

    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);

    const setText = (key: TextKey | "description") => (value: Localized) =>
        setTexts((t) => ({ ...t, [key]: value }));

    const autoStatus = academicStatusAt(new Date());
    const autoGradeLabel = autoStatus.graduated ? "修了" : autoStatus.grade;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSavedAt(null);

        startTransition(async () => {
            const res = await saveProfile({
                ...texts,
                gradeOverride,
                hobbies: { ja: hobbiesText.ja.split("\n"), en: hobbiesText.en.split("\n") },
                languages: languagesText.split("\n"),
            });

            if (!res.ok) {
                setError(res.error);
                return;
            }
            setSavedAt(Date.now());
        });
    };

    const renderFields = (fields: Field[]) =>
        fields.map(({ key, label, placeholder }) => (
            <LocalizedField
                key={key}
                label={label}
                value={texts[key]}
                onChange={setText(key)}
                placeholder={placeholder}
                maxLength={300}
                disabled={pending}
            />
        ));

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-xs leading-relaxed text-white/40">
                日本語は必須です。英語が空欄の項目は、英語ページでも日本語で表示されます。
            </p>

            <Panel className="space-y-5 p-6 sm:p-8">
                <p className="text-sm tracking-[0.24em] text-white/80">基本情報</p>
                {renderFields(BASIC_FIELDS)}
                <LocalizedField
                    label="紹介文（description。検索結果やOGPに使われます）"
                    value={texts.description}
                    onChange={setText("description")}
                    multiline
                    rows={3}
                    maxLength={2000}
                    disabled={pending}
                />
            </Panel>

            <Panel className="space-y-5 p-6 sm:p-8">
                <p className="text-sm tracking-[0.24em] text-white/80">学校・学年</p>
                {renderFields(SCHOOL_FIELDS)}

                <label className={adminLabelClass}>
                    学年の上書き（空欄なら年度から自動計算：現在は「{autoGradeLabel}」）
                    <input
                        type="text"
                        value={gradeOverride}
                        onChange={(e) => setGradeOverride(e.target.value)}
                        placeholder={autoGradeLabel ?? ""}
                        maxLength={100}
                        disabled={pending}
                        className={adminFieldClass}
                    />
                </label>
            </Panel>

            <Panel className="space-y-5 p-6 sm:p-8">
                <p className="text-sm tracking-[0.24em] text-white/80">スキル・趣味</p>
                <p className="text-xs text-white/40">1行に1項目ずつ入力してください</p>

                <label className={adminLabelClass}>
                    使用言語 / 技術（日英共通）
                    <textarea
                        value={languagesText}
                        onChange={(e) => setLanguagesText(e.target.value)}
                        rows={6}
                        disabled={pending}
                        className={`${adminFieldClass} resize-y`}
                    />
                </label>

                <LocalizedField
                    label="趣味"
                    value={hobbiesText}
                    onChange={setHobbiesText}
                    multiline
                    rows={6}
                    disabled={pending}
                />
            </Panel>

            <div className="flex flex-wrap items-center gap-4">
                <button
                    type="submit"
                    disabled={pending}
                    className="rounded-full border border-cyan-200/30 px-8 py-2.5 text-xs tracking-widest text-white shadow-[0_0_20px_rgba(120,255,255,0.2)] transition-shadow hover:shadow-[0_0_30px_rgba(120,255,255,0.4)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                    {pending ? "保存中..." : "保存する"}
                </button>

                {error && (
                    <p className="text-sm text-rose-300" role="alert">
                        {error}
                    </p>
                )}
                {savedAt && !error && (
                    <p className="text-sm text-cyan-200" role="status">
                        保存しました
                    </p>
                )}
            </div>
        </form>
    );
};
