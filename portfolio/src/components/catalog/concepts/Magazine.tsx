// src/components/catalog/concepts/Magazine.tsx
import React from "react";
import { Part, textFor } from "@/components/catalog/Part";
import type { Locale } from "@/lib/i18n";
import type { ConceptView } from "./types";

/**
 * THE GRID（ブルータリズム）。太い黒の罫線・等幅フォント・蛍光イエロー。角は丸めず、影もずらしたベタ塗りにする
 */

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", "Noto Sans Mono", monospace';
const HEAVY = '"Arial Black", "Helvetica Neue", Arial, "Hiragino Sans", "Noto Sans JP", sans-serif';

const Frame: ConceptView["Frame"] = ({ children, className = "" }) => (
    <div className={`bg-white text-[#111] ${className}`} style={{ fontFamily: MONO }}>
        {children}
    </div>
);

const Ticker = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [
        t("速報：今夜 21 時から深夜ラジオ特番", "LIVE: late-night radio special at 9 p.m."),
        t("新連載「路地裏の建築」スタート", "New series: Back-alley architecture"),
        t("読者アンケート受付中", "Reader survey now open"),
    ];
    // 同じ列を2回並べて半分だけ動かすと、切れ目なく流れ続ける
    const row = items.map((item) => (
        <span key={item} className="px-6">
            ■ {item}
        </span>
    ));
    return (
        // 動きを減らす設定では流さず、2回目の列を隠して横にスクロールして読めるようにする
        <Part
            id="ticker"
            className="overflow-hidden border-b-[3px] border-[#111] bg-[#ffe500] py-1.5 text-xs font-bold motion-reduce:overflow-x-auto"
        >
            <div className="flex w-max animate-marquee whitespace-nowrap motion-reduce:animate-none">
                {row}
                <span aria-hidden className="contents motion-reduce:hidden">
                    {row}
                </span>
            </div>
        </Part>
    );
};

const GlobalNav = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [t("ニュース", "NEWS"), t("カルチャー", "CULTURE"), t("音楽", "MUSIC"), t("街", "CITY")];
    return (
        <Part id="global-nav" as="header" className="flex flex-wrap items-stretch justify-between border-b-[3px] border-[#111]">
            <p className="px-4 py-3 text-2xl tracking-tighter" style={{ fontFamily: HEAVY }}>
                THE GRID
            </p>
            <ul className="flex text-xs font-bold">
                {items.map((item, i) => (
                    <li
                        key={item}
                        className={`flex items-center border-l-[3px] border-[#111] px-3 ${i === 1 ? "bg-[#111] text-[#ffe500]" : ""}`}
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </Part>
    );
};

const Breadcrumb = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="breadcrumb" as="nav" className="px-4 pt-4 text-[11px]">
            <span className="underline">{t("ホーム", "HOME")}</span>
            <span className="px-2">/</span>
            <span className="underline">{t("カルチャー", "CULTURE")}</span>
            <span className="px-2">/</span>
            <span className="bg-[#111] px-1 text-white">{t("特集", "FEATURES")}</span>
        </Part>
    );
};

const Badge = ({ lang, kind = "breaking" }: { lang: Locale; kind?: "breaking" | "pr" }) => (
    <Part
        id="badge"
        as="span"
        className={`inline-block px-1.5 py-0.5 text-[10px] font-bold ${kind === "breaking" ? "bg-[#ff3b1f] text-white" : "border-2 border-[#111]"}`}
    >
        {kind === "breaking" ? textFor(lang)("速報", "BREAKING") : "PR"}
    </Part>
);

const Tag = ({ label }: { label: string }) => (
    <Part id="tag" as="span" className="inline-block border-2 border-[#111] px-1.5 text-[10px] font-bold">
        #{label}
    </Part>
);

const CtaButton = ({ lang }: { lang: Locale }) => (
    <Part
        id="cta-button"
        as="span"
        className="inline-block border-[3px] border-[#111] bg-[#ffe500] px-5 py-2.5 text-sm font-bold shadow-[5px_5px_0_#111]"
    >
        {textFor(lang)("特集を読む →", "READ THE STORY →")}
    </Part>
);

/** 写真の代わりの絵。網点とベタの四角だけで作る */
const Photo = ({ className = "", tone = 0 }: { className?: string; tone?: number }) => {
    const fills = ["bg-[#111]", "bg-[#ff3b1f]", "bg-[#ffe500]", "bg-[#d4d4d4]"];
    return (
        <div className={`relative overflow-hidden border-[3px] border-[#111] ${fills[tone % fills.length]} ${className}`}>
            <div
                className="absolute inset-0 opacity-30"
                style={{ backgroundImage: "radial-gradient(#fff 1.2px, transparent 1.2px)", backgroundSize: "8px 8px" }}
            />
            <div className="absolute bottom-3 left-3 h-1/2 w-1/3 border-[3px] border-[#111] bg-white" />
        </div>
    );
};

const Hero = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="hero" as="section" className="grid gap-5 p-4 sm:grid-cols-2">
            <Photo className="aspect-[4/3]" />
            <div className="flex flex-col justify-between gap-4">
                <div>
                    <div className="flex flex-wrap gap-1.5">
                        <Badge lang={lang} />
                        <Tag label={t("建築", "architecture")} />
                        <Tag label={t("夜の街", "nightlife")} />
                    </div>
                    <p className="mt-3 text-3xl leading-none tracking-tight sm:text-4xl" style={{ fontFamily: HEAVY }}>
                        {t("眠らない路地の、", "THE ALLEYS")}
                        <br />
                        {t("設計図。", "THAT NEVER SLEEP.")}
                    </p>
                    <p className="mt-3 text-xs leading-relaxed">
                        {t(
                            "高架下に生まれた24時間の商店街。誰が線を引いたのでもない街の、見えない設計を読み解く。",
                            "A 24-hour arcade under the tracks. Reading the hidden plan of a street nobody designed."
                        )}
                    </p>
                </div>
                <div>
                    <CtaButton lang={lang} />
                </div>
            </div>
        </Part>
    );
};

const Tabs = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [t("すべて", "ALL"), t("特集", "FEATURES"), t("インタビュー", "INTERVIEWS"), t("コラム", "COLUMNS")];
    return (
        <Part id="tabs" as="nav" className="mx-4 mt-4 flex overflow-x-auto border-[3px] border-[#111] text-xs font-bold">
            {items.map((item, i) => (
                <span
                    key={item}
                    className={`flex-1 whitespace-nowrap px-3 py-2 text-center ${i > 0 ? "border-l-[3px] border-[#111]" : ""} ${i === 1 ? "bg-[#ffe500]" : ""}`}
                >
                    {item}
                </span>
            ))}
        </Part>
    );
};

const Card = ({ lang, index }: { lang: Locale; index: number }) => {
    const t = textFor(lang);
    const items = [
        { title: t("レコード店の店主が選ぶ、真夜中の10枚", "10 midnight records, picked by a shop owner"), tag: t("音楽", "music") },
        { title: t("取り壊し前の銭湯で、最後の一番風呂", "The last first bath before demolition"), tag: t("街", "city"), pr: false },
        { title: t("自転車で巡る、看板建築の通り", "Cycling past the signboard buildings"), tag: t("建築", "architecture"), pr: true },
    ];
    const item = items[index % items.length];
    return (
        <Part id="card" as="article" className="border-[3px] border-[#111] bg-white shadow-[5px_5px_0_#111]">
            <Photo className="aspect-[16/9] border-0 border-b-[3px]" tone={index + 1} />
            <div className="space-y-2 p-3">
                <div className="flex flex-wrap gap-1.5">
                    {item.pr && <Badge lang={lang} kind="pr" />}
                    <Tag label={item.tag} />
                </div>
                <p className="text-sm font-bold leading-snug">{item.title}</p>
            </div>
        </Part>
    );
};

const Pagination = () => (
    <Part id="pagination" as="nav" className="flex justify-center gap-0 px-4 py-8 text-xs font-bold">
        {["←", "1", "2", "3", "…", "12", "→"].map((label, i) => (
            <span
                key={i}
                className={`flex h-9 min-w-9 items-center justify-center border-[3px] border-[#111] px-2 ${i > 0 ? "-ml-[3px]" : ""} ${label === "2" ? "bg-[#111] text-[#ffe500]" : "bg-white"}`}
            >
                {label}
            </span>
        ))}
    </Part>
);

const Newsletter = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="newsletter" as="section" className="mx-4 mb-8 border-[3px] border-[#111] bg-[#ffe500] p-4">
            <p className="text-lg leading-none" style={{ fontFamily: HEAVY }}>
                {t("毎週金曜、街の話を。", "CITY STORIES, EVERY FRIDAY.")}
            </p>
            <div className="mt-3 flex">
                <span className="flex-1 border-[3px] border-[#111] bg-white px-3 py-2 text-xs text-[#111]/50">you@example.com</span>
                <span className="-ml-[3px] border-[3px] border-[#111] bg-[#111] px-4 py-2 text-xs font-bold text-[#ffe500]">
                    {t("購読", "SUBSCRIBE")}
                </span>
            </div>
        </Part>
    );
};

const Footer = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="footer" as="footer" className="border-t-[3px] border-[#111] bg-[#111] px-4 py-6 text-white">
            <p className="text-4xl leading-none tracking-tighter text-[#ffe500]" style={{ fontFamily: HEAVY }}>
                THE GRID
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                {[t("編集部について", "ABOUT"), t("広告掲載", "ADVERTISE"), t("プライバシー", "PRIVACY"), "RSS"].map((item) => (
                    <li key={item} className="underline">
                        {item}
                    </li>
                ))}
            </ul>
            <p className="mt-4 text-[10px] text-white/50">© THE GRID MAGAZINE</p>
        </Part>
    );
};

const Page: ConceptView["Page"] = ({ lang }) => (
    <Frame>
        <Ticker lang={lang} />
        <GlobalNav lang={lang} />
        <Breadcrumb lang={lang} />
        <Hero lang={lang} />
        <Tabs lang={lang} />
        <div className="grid gap-5 p-4 pt-6 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
                <Card key={i} lang={lang} index={i} />
            ))}
        </div>
        <Pagination />
        <Newsletter lang={lang} />
        <Footer lang={lang} />
    </Frame>
);

export const magazine: ConceptView = {
    Frame,
    Page,
    samples: {
        ticker: Ticker,
        "global-nav": GlobalNav,
        breadcrumb: ({ lang }) => (
            <div className="pb-4">
                <Breadcrumb lang={lang} />
            </div>
        ),
        hero: Hero,
        badge: ({ lang }) => (
            <div className="flex gap-2 p-6">
                <Badge lang={lang} />
                <Badge lang={lang} kind="pr" />
            </div>
        ),
        tag: ({ lang }) => (
            <div className="flex gap-1.5 p-6">
                <Tag label={textFor(lang)("建築", "architecture")} />
                <Tag label={textFor(lang)("夜の街", "nightlife")} />
            </div>
        ),
        "cta-button": ({ lang }) => (
            <div className="p-6">
                <CtaButton lang={lang} />
            </div>
        ),
        tabs: ({ lang }) => (
            <div className="pb-4">
                <Tabs lang={lang} />
            </div>
        ),
        card: ({ lang }) => (
            <div className="max-w-xs p-6">
                <Card lang={lang} index={2} />
            </div>
        ),
        pagination: Pagination,
        newsletter: ({ lang }) => (
            <div className="pt-4">
                <Newsletter lang={lang} />
            </div>
        ),
        footer: Footer,
    },
};
