// src/components/catalog/concepts/Kissa.tsx
import React from "react";
import { DemoForm, JumpButton, JumpNav } from "@/components/catalog/Interactive";
import { Part, textFor } from "@/components/catalog/Part";
import type { Locale } from "@/lib/i18n";
import type { ConceptView } from "./types";

/**
 * 喫茶 ほしづき（和モダン）。生成りの背景・明朝体・朱色の差し色。
 * ナビと予約のボタンはページの中の該当する場所へ動き、予約のフォームは入力できる（送信してもどこにも送らない）
 */

const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", YuMincho, "Noto Serif JP", "Times New Roman", serif';

const Frame: ConceptView["Frame"] = ({ children, className = "" }) => (
    <div className={`bg-[#f4efe6] text-[#2b2622] ${className}`} style={{ fontFamily: MINCHO }}>
        {children}
    </div>
);

/** 写真の代わりの絵。珈琲の色のグラデーションに、月を1つ浮かべる */
const Photo = ({ className = "", tone = 0 }: { className?: string; tone?: number }) => {
    const tones = [
        "from-[#6b4a35] via-[#3b2a20] to-[#1f1712]",
        "from-[#c9a27c] via-[#8a6448] to-[#4a3426]",
        "from-[#a8b49a] via-[#6f7d63] to-[#3d4636]",
        "from-[#d8c3a5] via-[#b08d6a] to-[#6b4f3a]",
    ];
    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${tones[tone % tones.length]} ${className}`}>
            <div className="absolute right-[18%] top-[18%] h-8 w-8 rounded-full bg-[#f4efe6]/80 shadow-[0_0_24px_rgba(244,239,230,0.6)]" />
        </div>
    );
};

const Badge = ({ lang }: { lang: Locale }) => (
    <Part id="badge" as="span" className="inline-block border border-[#b5452c] px-2 py-0.5 text-[11px] tracking-widest text-[#b5452c]">
        {textFor(lang)("季節限定", "Seasonal")}
    </Part>
);

const CtaButton = ({ lang }: { lang: Locale }) => (
    <Part id="cta-button" as="span" className="inline-flex">
        <JumpButton target="form" className="whitespace-nowrap bg-[#b5452c] px-6 py-3 text-sm tracking-[0.2em] text-[#f4efe6] hover:bg-[#9a3a25]">
            {textFor(lang)("席を予約する", "Reserve a table")}
        </JumpButton>
    </Part>
);

const GlobalNav = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="global-nav" as="header" className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2b2622]/15 px-6 py-4">
            <div>
                <p className="text-lg tracking-[0.3em]">{t("喫茶 ほしづき", "Kissa Hoshizuki")}</p>
                <p className="text-[9px] tracking-[0.4em] text-[#8a7a66]">SINCE 1987</p>
            </div>
            <JumpNav
                items={[
                    { label: t("お品書き", "Menu"), target: "menu-list" },
                    { label: t("お知らせ", "News"), target: "card" },
                    { label: t("店内", "Inside"), target: "gallery" },
                    { label: t("ご予約", "Reserve"), target: "form" },
                ]}
                className="flex gap-5 text-xs tracking-[0.2em]"
                itemClassName="border-b pb-1"
                activeClassName="border-[#b5452c] text-[#b5452c]"
                inactiveClassName="border-transparent text-[#2b2622]/70 hover:text-[#b5452c]"
            />
        </Part>
    );
};

const Hero = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="hero" as="section" className="grid items-center gap-8 px-6 py-10 sm:grid-cols-[1fr_1.2fr] sm:py-14">
            {/* 縦書きは日本語のときだけ（英語を縦にすると文字が横倒しになる）。英語は見出しを上に置く */}
            <div className={`flex flex-col gap-6 ${lang === "ja" ? "sm:flex-row-reverse sm:items-start sm:justify-end" : ""}`}>
                <p
                    className={`text-2xl leading-relaxed sm:text-3xl ${lang === "ja" ? "tracking-[0.25em] sm:[writing-mode:vertical-rl]" : "tracking-[0.08em]"}`}
                >
                    {t("星の見える窓辺で、一杯を。", "A cup by the starlit window.")}
                </p>
                <div className={lang === "ja" ? "sm:mt-24" : ""}>
                    <Badge lang={lang} />
                    <p className="mt-3 max-w-[16rem] text-xs leading-loose text-[#2b2622]/75">
                        {t(
                            "栗の甘みを引き出した、秋だけのブレンドをご用意しました。夜は二十三時まで灯りをともしています。",
                            "Our autumn-only blend brings out the sweetness of chestnut. The lights stay on until 11 p.m."
                        )}
                    </p>
                    <div className="mt-6">
                        <CtaButton lang={lang} />
                    </div>
                </div>
            </div>
            <Photo className="aspect-[4/3] w-full" />
        </Part>
    );
};

const FeatureGrid = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [
        { mark: "壱", title: t("自家焙煎", "House-roasted"), text: t("毎朝、その日の分だけを小さな釜で煎ります。", "Roasted in a small batch each morning.") },
        { mark: "弐", title: t("季節の菓子", "Seasonal sweets"), text: t("近所の和菓子屋と、季節ごとに考えています。", "Created each season with a local confectioner.") },
        { mark: "参", title: t("夜更けまで", "Open late"), text: t("仕事帰りにも寄れるよう、夜まで開けています。", "Open into the night for the trip home.") },
    ];
    return (
        <Part id="feature-grid" as="section" className="grid gap-6 border-y border-[#2b2622]/15 px-6 py-10 sm:grid-cols-3">
            {items.map((item) => (
                <div key={item.mark} className="text-center">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#b5452c] text-sm text-[#b5452c]">
                        {item.mark}
                    </span>
                    <p className="mt-3 text-sm tracking-[0.2em]">{item.title}</p>
                    <p className="mt-2 text-xs leading-relaxed text-[#2b2622]/70">{item.text}</p>
                </div>
            ))}
        </Part>
    );
};

const MenuList = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [
        { name: t("ほしづきブレンド", "Hoshizuki blend"), price: "¥600" },
        { name: t("浅煎り 本日の豆", "Light roast of the day"), price: "¥650" },
        { name: t("栗のブレンド", "Chestnut blend"), price: "¥680", seasonal: true },
        { name: t("黒糖のプリン", "Brown-sugar pudding"), price: "¥520" },
    ];
    return (
        <Part id="menu-list" as="section" className="px-6 py-10">
            <p className="mb-5 text-center text-sm tracking-[0.4em]">{t("お品書き", "MENU")}</p>
            <ul className="mx-auto max-w-md space-y-3 text-sm">
                {items.map((item) => (
                    <li key={item.name} className="flex items-baseline gap-2">
                        <span className="tracking-wider">{item.name}</span>
                        {item.seasonal && <Badge lang={lang} />}
                        <span className="flex-1 border-b border-dotted border-[#2b2622]/40" />
                        <span className="tabular-nums">{item.price}</span>
                    </li>
                ))}
            </ul>
        </Part>
    );
};

const Card = ({ lang, index }: { lang: Locale; index: number }) => {
    const t = textFor(lang);
    const items = [
        { date: "2026.10.01", title: t("秋のブレンドを始めました", "Our autumn blend is here") },
        { date: "2026.09.12", title: t("十月の定休日のお知らせ", "Closed days in October") },
        { date: "2026.08.30", title: t("夜の部の時間が変わります", "New evening hours") },
    ];
    const item = items[index % items.length];
    return (
        <Part id="card" as="article" className="bg-[#fbf8f2] shadow-[0_1px_0_rgba(43,38,34,0.15)]">
            <Photo className="aspect-[3/2]" tone={index + 1} />
            <div className="p-4">
                <p className="text-[10px] tracking-[0.2em] text-[#8a7a66]">{item.date}</p>
                <p className="mt-1 text-sm tracking-wider">{item.title}</p>
            </div>
        </Part>
    );
};

const Gallery = () => (
    <Part id="gallery" className="grid grid-cols-3 grid-rows-2 gap-2 px-6 py-10">
        <Photo className="col-span-2 row-span-2 min-h-40" tone={0} />
        <Photo className="min-h-20" tone={3} />
        <Photo className="min-h-20" tone={2} />
    </Part>
);

const Testimonial = ({ lang }: { lang: Locale }) => (
    <Part id="testimonial" as="aside" className="mx-6 my-10 border-l-2 border-[#b5452c] bg-[#fbf8f2] px-6 py-5">
        <p className="text-sm leading-loose">
            {textFor(lang)(
                "「窓際の席で、ゆっくり本を読むのが週末の楽しみです。」",
                "“Reading slowly at the window seat is my weekend ritual.”"
            )}
        </p>
        <p className="mt-2 text-right text-[11px] tracking-widest text-[#8a7a66]">{textFor(lang)("― 常連のお客様", "— A regular")}</p>
    </Part>
);

const Form = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const label = "text-[11px] tracking-[0.2em] text-[#8a7a66]";
    const input = "mt-1 w-full border-b border-[#2b2622]/40 bg-transparent pb-1 text-sm outline-none focus:border-[#b5452c]";
    return (
        <Part id="form" as="section" className="px-6 py-10">
            <p className="mb-5 text-center text-sm tracking-[0.4em]">{t("ご予約", "RESERVE")}</p>
            <DemoForm
                className="mx-auto max-w-sm space-y-4"
                sentMessage={t("ご予約を承りました（見本なので、どこにも送っていません）", "Reservation received (this is a sample, so nothing was sent)")}
                sentClassName="text-center text-xs tracking-wider text-[#b5452c]"
            >
                <div>
                    <label htmlFor="kissa-name" className={label}>
                        {t("お名前", "Name")}
                    </label>
                    <input id="kissa-name" required defaultValue={t("星野 月子", "Tsukiko Hoshino")} className={input} />
                </div>
                <div>
                    <label htmlFor="kissa-date" className={label}>
                        {t("日にち", "Date")}
                    </label>
                    <input id="kissa-date" type="date" required defaultValue="2026-11-03" className={input} />
                </div>
                <div>
                    <label htmlFor="kissa-guests" className={label}>
                        {t("人数", "Guests")}
                    </label>
                    <select id="kissa-guests" defaultValue="2" className={`${input} cursor-pointer`}>
                        {[1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>
                                {t(`${n}名`, n === 1 ? "1 person" : `${n} people`)}
                            </option>
                        ))}
                    </select>
                </div>
                <p className="pt-2 text-center">
                    <button type="submit" className="border border-[#2b2622] px-8 py-2 text-xs tracking-[0.3em] hover:bg-[#2b2622] hover:text-[#f4efe6]">
                        {t("送信する", "Send")}
                    </button>
                </p>
            </DemoForm>
        </Part>
    );
};

const Footer = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="footer" as="footer" className="bg-[#2b2622] px-6 py-8 text-[#f4efe6]/80">
            <div className="flex flex-wrap justify-between gap-6 text-xs leading-loose tracking-wider">
                <div>
                    <p className="text-sm tracking-[0.3em] text-[#f4efe6]">{t("喫茶 ほしづき", "Kissa Hoshizuki")}</p>
                    <p>{t("星見町 1-2-3　月の坂ビル 1階", "1F Tsukinosaka Bldg, 1-2-3 Hoshimi")}</p>
                    <p>{t("12:00〜23:00　水曜定休", "12:00–23:00, closed Wednesdays")}</p>
                </div>
                <ul className="space-y-1">
                    <li>{t("お品書き", "Menu")}</li>
                    <li>{t("お知らせ", "News")}</li>
                    <li>{t("ご予約", "Reserve")}</li>
                </ul>
            </div>
            <p className="mt-6 text-[10px] tracking-widest text-[#f4efe6]/50">© Kissa Hoshizuki</p>
        </Part>
    );
};

const Page: ConceptView["Page"] = ({ lang }) => (
    <Frame>
        <GlobalNav lang={lang} />
        <Hero lang={lang} />
        <FeatureGrid lang={lang} />
        <MenuList lang={lang} />
        <section className="px-6 pb-4">
            <p className="mb-5 text-center text-sm tracking-[0.4em]">{textFor(lang)("お知らせ", "NEWS")}</p>
            <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <Card key={i} lang={lang} index={i} />
                ))}
            </div>
        </section>
        <Gallery />
        <Testimonial lang={lang} />
        <Form lang={lang} />
        <Footer lang={lang} />
    </Frame>
);

export const kissa: ConceptView = {
    Frame,
    Page,
    samples: {
        "global-nav": GlobalNav,
        hero: Hero,
        "cta-button": ({ lang }) => (
            <div className="p-6">
                <CtaButton lang={lang} />
            </div>
        ),
        badge: ({ lang }) => (
            <div className="p-6">
                <Badge lang={lang} />
            </div>
        ),
        "feature-grid": FeatureGrid,
        "menu-list": MenuList,
        card: ({ lang }) => (
            <div className="max-w-xs p-6">
                <Card lang={lang} index={0} />
            </div>
        ),
        gallery: Gallery,
        testimonial: Testimonial,
        form: Form,
        footer: Footer,
    },
};
