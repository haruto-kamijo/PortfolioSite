// src/components/career/CareerTimeline.tsx
"use client";

import Link from "next/link";
import React, { useState } from "react";
import { CAREER_KINDS, CareerDate, CareerItem, CareerKind, yearOf } from "@/lib/content/career";
import { Locale, localizePath, pick } from "@/lib/i18n";

/** 種類ごとの印の色 */
const KIND_COLORS: Record<CareerKind, string> = {
    education: "bg-cyan-300",
    research: "bg-violet-300",
    work: "bg-amber-300",
    achievement: "bg-emerald-300",
};

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (date: CareerDate, lang: Locale) => {
    const [year, month] = date.split("-");
    if (!month) return lang === "ja" ? `${year}年` : year;
    return lang === "ja" ? `${year}年${Number(month)}月` : `${MONTHS_EN[Number(month) - 1]} ${year}`;
};

/** サイトの中のパス（/portfolio?tag=… など）か。//example.com はブラウザが別のサイトとして扱うので外す */
const isInternal = (href: string) => /^\/(?![/\\])/.test(href);

export type CareerTexts = {
    filterLabel: string;
    all: string;
    kinds: Record<CareerKind, string>;
    present: string;
    emptyKind: string;
};

/**
 * 経歴の年表。年ごとに見出しを立て、新しい順に並べる（並べるのは getCareer）。
 * 上のボタンで種類を絞り込む。絞り込みは画面の中だけで行い、URL は変えない
 */
export const CareerTimeline = ({ items, lang, texts }: { items: CareerItem[]; lang: Locale; texts: CareerTexts }) => {
    const [kind, setKind] = useState<CareerKind | "all">("all");
    // 1件も無い種類のボタンは出さない
    const kinds = CAREER_KINDS.filter((k) => items.some((item) => item.kind === k));
    const shown = kind === "all" ? items : items.filter((item) => item.kind === kind);

    const years: { year: string; items: CareerItem[] }[] = [];
    for (const item of shown) {
        const year = yearOf(item);
        if (years[years.length - 1]?.year !== year) years.push({ year, items: [] });
        years[years.length - 1].items.push(item);
    }

    const range = (item: CareerItem) =>
        item.end === null
            ? formatDate(item.start, lang)
            : `${formatDate(item.start, lang)} 〜 ${item.end === "present" ? texts.present : formatDate(item.end, lang)}`;

    return (
        <>
            <div role="group" aria-label={texts.filterLabel} className="mb-10 flex flex-wrap gap-2">
                {(["all", ...kinds] as const).map((k) => (
                    <button
                        key={k}
                        type="button"
                        aria-pressed={kind === k}
                        onClick={() => setKind(k)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs tracking-widest transition-colors ${
                            kind === k
                                ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-200"
                                : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                        }`}
                    >
                        {k !== "all" && <span aria-hidden className={`h-2 w-2 rounded-full ${KIND_COLORS[k]}`} />}
                        {k === "all" ? texts.all : texts.kinds[k]}
                    </button>
                ))}
            </div>

            {years.length === 0 ? (
                <p className="text-sm text-white/50">{texts.emptyKind}</p>
            ) : (
                <div className="space-y-12">
                    {years.map(({ year, items: inYear }) => (
                        <section key={year} aria-labelledby={`career-${year}`} className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-8">
                            <h2 id={`career-${year}`} className="text-2xl tracking-[0.1em] text-white/80 sm:pt-1 sm:text-right">
                                {year}
                            </h2>
                            <ol className="space-y-6 border-l border-white/15 pl-6">
                                {inYear.map((item) => {
                                    const org = pick(item.org, lang);
                                    const description = pick(item.description, lang);
                                    return (
                                        <li key={item.id} data-kind={item.kind} className="relative">
                                            {/* 線の上の印。種類は色と文字の両方で伝える */}
                                            <span
                                                aria-hidden
                                                className={`absolute -left-[1.85rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-black ${KIND_COLORS[item.kind]}`}
                                            />
                                            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tracking-wider text-white/50">
                                                <span>{range(item)}</span>
                                                <span className="text-cyan-100/60">{texts.kinds[item.kind]}</span>
                                            </p>
                                            <h3 className="mt-1.5 text-base text-white">{pick(item.title, lang)}</h3>
                                            {org && <p className="mt-0.5 text-sm text-slate-300">{org}</p>}
                                            {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>}
                                            {item.links.length > 0 && (
                                                <ul className="mt-3 flex flex-wrap gap-2">
                                                    {item.links.map((link, i) => (
                                                        <li key={`${i}-${link.href}`}>
                                                            {isInternal(link.href) ? (
                                                                <Link
                                                                    href={localizePath(link.href, lang)}
                                                                    className="inline-block rounded-full border border-white/15 px-3 py-1.5 text-[11px] tracking-wider text-white/70 transition-colors hover:border-cyan-200/40 hover:text-cyan-200"
                                                                >
                                                                    {pick(link.label, lang)} →
                                                                </Link>
                                                            ) : (
                                                                <a
                                                                    href={link.href}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-block rounded-full border border-white/15 px-3 py-1.5 text-[11px] tracking-wider text-white/70 transition-colors hover:border-cyan-200/40 hover:text-cyan-200"
                                                                >
                                                                    {pick(link.label, lang)} ↗
                                                                </a>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </section>
                    ))}
                </div>
            )}
        </>
    );
};
