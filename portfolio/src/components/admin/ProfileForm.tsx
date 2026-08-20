// src/components/admin/ProfileForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Panel } from "@/components/ui/Panel";
import { ProfileContent } from "@/lib/content/types";
import { academicStatusAt } from "@/lib/academicYear";
import { saveProfile } from "@/app/admin/profile/actions";

const fieldClass = [
    "mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5",
    "text-sm text-white placeholder:text-white/25",
    "outline-none transition-colors",
    "focus:border-cyan-200/60 focus:ring-1 focus:ring-cyan-200/30",
].join(" ");

const labelClass = "block text-xs tracking-[0.16em] text-cyan-100/70";

type Field = {
    key: keyof typeof INITIAL_TEXT_FIELDS;
    label: string;
    hint?: string;
};

const INITIAL_TEXT_FIELDS = {
    name: "",
    nameJa: "",
    role: "",
    tagline: "",
    school: "",
    schoolShort: "",
    program: "",
    programJa: "",
    gradeOverride: "",
};

const BASIC_FIELDS: Field[] = [
    { key: "name", label: "名前（英語表記）" },
    { key: "nameJa", label: "名前（日本語表記）" },
    { key: "role", label: "肩書き" },
    { key: "tagline", label: "キャッチコピー" },
];

const SCHOOL_FIELDS: Field[] = [
    { key: "school", label: "学校名" },
    { key: "schoolShort", label: "学校名（略称）" },
    { key: "program", label: "専攻（英語）" },
    { key: "programJa", label: "専攻（日本語）" },
];

export const ProfileForm = ({ initial }: { initial: ProfileContent }) => {
    const [fields, setFields] = useState({
        name: initial.name,
        nameJa: initial.nameJa,
        role: initial.role,
        tagline: initial.tagline,
        school: initial.school,
        schoolShort: initial.schoolShort,
        program: initial.program,
        programJa: initial.programJa,
        gradeOverride: initial.gradeOverride ?? "",
    });
    const [description, setDescription] = useState(initial.description);
    const [hobbiesText, setHobbiesText] = useState(initial.hobbies.join("\n"));
    const [languagesText, setLanguagesText] = useState(initial.languages.join("\n"));

    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);

    const setField = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields((f) => ({ ...f, [key]: e.target.value }));
    };

    const autoStatus = academicStatusAt(new Date());
    const autoGradeLabel = autoStatus.graduated ? "OB" : autoStatus.grade;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSavedAt(null);

        startTransition(async () => {
            const res = await saveProfile({
                ...fields,
                description,
                hobbies: hobbiesText.split("\n"),
                languages: languagesText.split("\n"),
            });

            if (!res.ok) {
                setError(res.error);
                return;
            }
            setSavedAt(Date.now());
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Panel className="space-y-5 p-6 sm:p-8">
                <p className="text-sm tracking-[0.24em] text-white/80">基本情報</p>

                <div className="grid gap-5 sm:grid-cols-2">
                    {BASIC_FIELDS.map(({ key, label }) => (
                        <label key={key} className={labelClass}>
                            {label}
                            <input
                                type="text"
                                value={fields[key]}
                                onChange={setField(key)}
                                maxLength={300}
                                required
                                disabled={pending}
                                className={fieldClass}
                            />
                        </label>
                    ))}
                </div>

                <label className={labelClass}>
                    紹介文（description。検索結果やOGPに使われます）
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        required
                        disabled={pending}
                        className={`${fieldClass} resize-y`}
                    />
                </label>
            </Panel>

            <Panel className="space-y-5 p-6 sm:p-8">
                <p className="text-sm tracking-[0.24em] text-white/80">学校・学年</p>

                <div className="grid gap-5 sm:grid-cols-2">
                    {SCHOOL_FIELDS.map(({ key, label }) => (
                        <label key={key} className={labelClass}>
                            {label}
                            <input
                                type="text"
                                value={fields[key]}
                                onChange={setField(key)}
                                maxLength={300}
                                required
                                disabled={pending}
                                className={fieldClass}
                            />
                        </label>
                    ))}
                </div>

                <label className={labelClass}>
                    学年の上書き（空欄なら年度から自動計算：現在は「{autoGradeLabel}」）
                    <input
                        type="text"
                        value={fields.gradeOverride}
                        onChange={setField("gradeOverride")}
                        placeholder={autoGradeLabel ?? ""}
                        maxLength={100}
                        disabled={pending}
                        className={fieldClass}
                    />
                </label>
            </Panel>

            <Panel className="space-y-5 p-6 sm:p-8">
                <p className="text-sm tracking-[0.24em] text-white/80">スキル・趣味</p>
                <p className="text-xs text-white/40">1行に1項目ずつ入力してください</p>

                <div className="grid gap-5 sm:grid-cols-2">
                    <label className={labelClass}>
                        使用言語 / 技術
                        <textarea
                            value={languagesText}
                            onChange={(e) => setLanguagesText(e.target.value)}
                            rows={6}
                            disabled={pending}
                            className={`${fieldClass} resize-y`}
                        />
                    </label>

                    <label className={labelClass}>
                        趣味
                        <textarea
                            value={hobbiesText}
                            onChange={(e) => setHobbiesText(e.target.value)}
                            rows={6}
                            disabled={pending}
                            className={`${fieldClass} resize-y`}
                        />
                    </label>
                </div>
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
