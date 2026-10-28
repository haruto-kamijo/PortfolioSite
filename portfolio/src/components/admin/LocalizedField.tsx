// src/components/admin/LocalizedField.tsx
"use client";

import { LOCALES, Locale, Localized } from "@/lib/i18n";

export const adminFieldClass = [
    "mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5",
    "text-sm text-white placeholder:text-white/25",
    "outline-none transition-colors",
    "focus:border-cyan-200/60 focus:ring-1 focus:ring-cyan-200/30",
].join(" ");

export const adminLabelClass = "block text-xs tracking-[0.16em] text-cyan-100/70";

const LANG_LABEL: Record<Locale, string> = { ja: "日本語", en: "English" };

/**
 * 管理画面で、同じ項目の日本語と英語を並べて入力する欄。
 * 日本語だけ必須にしている（英語が空なら公開ページで日本語を代わりに出すため）。
 */
export const LocalizedField = ({
                                   label,
                                   value,
                                   onChange,
                                   placeholder,
                                   multiline = false,
                                   rows = 3,
                                   maxLength,
                                   requiredJa = true,
                                   disabled,
                               }: {
    label: string;
    value: Localized;
    onChange: (value: Localized) => void;
    placeholder?: Localized;
    multiline?: boolean;
    rows?: number;
    maxLength?: number;
    requiredJa?: boolean;
    disabled?: boolean;
}) => (
    <fieldset>
        <legend className={adminLabelClass}>{label}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
            {LOCALES.map((lang) => {
                const common = {
                    value: value[lang],
                    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                        onChange({ ...value, [lang]: e.target.value }),
                    placeholder: placeholder?.[lang],
                    maxLength,
                    required: lang === "ja" && requiredJa,
                    disabled,
                    lang,
                    "aria-label": `${label}（${LANG_LABEL[lang]}）`,
                };
                return (
                    <label key={lang} className="block text-[10px] tracking-[0.16em] text-white/40">
                        {LANG_LABEL[lang]}
                        {multiline ? (
                            <textarea {...common} rows={rows} className={`${adminFieldClass} resize-y`} />
                        ) : (
                            <input type="text" {...common} className={adminFieldClass} />
                        )}
                    </label>
                );
            })}
        </div>
    </fieldset>
);
