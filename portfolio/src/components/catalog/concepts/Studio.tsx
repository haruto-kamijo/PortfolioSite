// src/components/catalog/concepts/Studio.tsx
import React from "react";
import { CounterPager, DemoForm, FilterItem, FilterScope, FilterTabs, JumpButton, JumpNav } from "@/components/catalog/Interactive";
import { Part, textFor } from "@/components/catalog/Part";
import type { Locale } from "@/lib/i18n";
import type { ConceptView } from "./types";

/**
 * Studio Kasumi（ミニマル）。白と灰色だけ・細い文字・大きな余白。UI は控えめにして、写真を主役にする
 */

const LIGHT = '"Helvetica Neue", Arial, "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif';

const Frame: ConceptView["Frame"] = ({ children, className = "" }) => (
    <div className={`bg-[#fafaf9] font-light text-[#1c1917] ${className}`} style={{ fontFamily: LIGHT }}>
        {children}
    </div>
);

/** 写真の代わりの絵。灰色の濃淡で、海と空のような層を作る */
const Photo = ({ className = "", tone = 0 }: { className?: string; tone?: number }) => {
    const tones = [
        "linear-gradient(180deg, #d6d3d1 0%, #e7e5e4 45%, #78716c 46%, #a8a29e 100%)",
        "linear-gradient(160deg, #57534e 0%, #a8a29e 60%, #e7e5e4 100%)",
        "radial-gradient(circle at 40% 35%, #f5f5f4 0 18%, #a8a29e 19% 100%)",
        "linear-gradient(90deg, #292524 0 30%, #d6d3d1 30% 100%)",
        "linear-gradient(200deg, #e7e5e4 0%, #78716c 100%)",
    ];
    return <div className={className} style={{ background: tones[tone % tones.length] }} />;
};

const GlobalNav = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="global-nav" as="header" className="flex items-center justify-between px-8 py-6">
            <p className="text-sm tracking-[0.5em]">KASUMI</p>
            <JumpNav
                items={[
                    { label: t("作品", "Works"), target: "gallery" },
                    { label: t("紹介", "About"), target: "stats" },
                    { label: t("連絡", "Contact"), target: "form" },
                ]}
                className="flex gap-6 text-[11px] tracking-[0.2em]"
                activeClassName="text-[#1c1917]"
                inactiveClassName="text-[#a8a29e] hover:text-[#1c1917]"
            />
        </Part>
    );
};

const Breadcrumb = ({ lang }: { lang: Locale }) => (
    <Part id="breadcrumb" as="nav" className="px-8 text-[10px] tracking-[0.2em] text-[#a8a29e]">
        {textFor(lang)("作品", "Works")} — <span className="text-[#1c1917]">{textFor(lang)("潮間帯", "Intertidal")}</span>
    </Part>
);

const CtaButton = ({ lang }: { lang: Locale }) => (
    <Part id="cta-button" as="span" className="inline-flex">
        <JumpButton target="form" className="border-b border-[#1c1917] pb-1 text-xs tracking-[0.25em] hover:opacity-60">
            {textFor(lang)("撮影のご相談", "Book a shoot")} →
        </JumpButton>
    </Part>
);

const Hero = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="hero" as="section" className="px-8 pb-16 pt-12">
            <p className="max-w-lg text-3xl leading-snug tracking-wide sm:text-4xl">
                {t("潮が引いたあとの、", "Light, left behind")}
                <br />
                {t("光を撮っています。", "by the tide.")}
            </p>
            <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
                <p className="max-w-xs text-xs leading-loose text-[#78716c]">
                    {t(
                        "海辺の町を拠点に、風景とポートレートを撮影しています。",
                        "Landscape and portrait photographer based in a seaside town."
                    )}
                </p>
                <CtaButton lang={lang} />
            </div>
        </Part>
    );
};

const Tabs = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="tabs" as="nav" className="flex gap-6 px-8 text-[11px] tracking-[0.2em]">
            <FilterTabs
                items={[
                    { label: t("すべて", "All"), value: "all" },
                    { label: t("風景", "Landscape"), value: "landscape" },
                    { label: t("人物", "Portrait"), value: "portrait" },
                    { label: t("広告", "Commercial"), value: "commercial" },
                ]}
                itemClassName="border-b pb-1"
                activeClassName="border-[#1c1917]"
                inactiveClassName="border-transparent text-[#a8a29e] hover:text-[#1c1917]"
            />
        </Part>
    );
};

const Tag = ({ label }: { label: string }) => (
    <Part id="tag" as="span" className="text-[10px] tracking-[0.15em] text-[#a8a29e]">
        {label}
    </Part>
);

const Gallery = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const landscape = { value: "landscape", label: t("風景", "Landscape") };
    const portrait = { value: "portrait", label: t("人物", "Portrait") };
    const commercial = { value: "commercial", label: t("広告", "Commercial") };
    const items = [
        { tone: 0, wide: true, title: t("潮間帯 I", "Intertidal I"), tag: landscape },
        { tone: 2, wide: false, title: t("灯台守", "Lighthouse keeper"), tag: portrait },
        { tone: 1, wide: false, title: t("霧の朝", "Morning fog"), tag: landscape },
        { tone: 4, wide: false, title: t("網を繕う人", "Net mender"), tag: portrait },
        { tone: 2, wide: false, title: t("浜の昼", "Noon on the beach"), tag: commercial },
        { tone: 3, wide: true, title: t("防波堤", "Breakwater"), tag: landscape },
    ];
    // 横長と縦長を交互に置き、大きさの差でリズムを出す。上のタブで選んだ種類だけを出す（FilterScope）
    return (
        <Part id="gallery" className="grid grid-cols-2 gap-x-6 gap-y-8 px-8 py-10 sm:grid-cols-4">
            {items.map((item) => (
                <FilterItem key={item.title} as="figure" value={item.tag.value} className={item.wide ? "col-span-2" : ""}>
                    <Photo className={`w-full ${item.wide ? "aspect-[16/9]" : "aspect-[3/4]"}`} tone={item.tone} />
                    <figcaption className="mt-2 flex items-baseline justify-between gap-2 text-[11px] tracking-[0.15em]">
                        {item.title}
                        <Tag label={item.tag.label} />
                    </figcaption>
                </FilterItem>
            ))}
        </Part>
    );
};

const Pagination = () => (
    <Part id="pagination" as="nav" className="flex items-center justify-between px-8 pb-12 text-[11px] tracking-[0.2em] text-[#a8a29e]">
        <CounterPager total={6} activeClassName="text-[#1c1917]" inactiveClassName="text-[#a8a29e]" />
    </Part>
);

const Stats = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [
        { value: "12", label: t("年の活動", "years") },
        { value: "340", label: t("件の撮影", "shoots") },
        { value: "8", label: t("回の個展", "solo shows") },
    ];
    return (
        <Part id="stats" as="section" className="grid grid-cols-3 border-y border-[#e7e5e4] px-8 py-8">
            {items.map((item) => (
                <div key={item.label}>
                    <p className="text-3xl font-extralight">{item.value}</p>
                    <p className="mt-1 text-[10px] tracking-[0.2em] text-[#a8a29e]">{item.label}</p>
                </div>
            ))}
        </Part>
    );
};

const Accordion = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [
        {
            title: t("ポートレート", "Portrait"),
            body: t("ロケーションの下見から納品まで、およそ三週間です。", "About three weeks from scouting to delivery."),
            open: true,
        },
        {
            title: t("雑誌・書籍", "Editorial"),
            body: t("誌面の構成に合わせて、縦位置と横位置の両方を撮ります。", "We shoot both portrait and landscape frames to fit your layout."),
        },
        {
            title: t("広告", "Commercial"),
            body: t("使う媒体と期間をうかがってから、お見積りをお送りします。", "Tell us the media and period, and we will send a quote."),
        },
    ];
    // 開け閉めは details に任せる（JavaScript が無くても動く）
    return (
        <Part id="accordion" as="section" className="px-8 py-12">
            {items.map((item) => (
                <details key={item.title} open={item.open} className="group border-b border-[#e7e5e4] py-4">
                    <summary className="flex cursor-pointer list-none justify-between text-sm tracking-[0.1em] [&::-webkit-details-marker]:hidden">
                        {item.title}
                        <span aria-hidden className="text-[#a8a29e] group-open:hidden">+</span>
                        <span aria-hidden className="hidden text-[#a8a29e] group-open:inline">−</span>
                    </summary>
                    <p className="mt-3 text-xs leading-loose text-[#78716c]">{item.body}</p>
                </details>
            ))}
        </Part>
    );
};

const Form = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const fields = [
        { id: "studio-name", label: t("お名前", "Name"), type: "text" },
        { id: "studio-email", label: t("メール", "Email"), type: "email" },
        { id: "studio-message", label: t("ご相談の内容", "Message"), tall: true },
    ];
    const input = "mt-2 w-full border-b border-[#d6d3d1] bg-transparent text-sm outline-none focus:border-[#1c1917]";
    return (
        <Part id="form" as="section" className="px-8 pb-12">
            <DemoForm
                sentMessage={t("送信しました（見本なので、どこにも送っていません）", "Sent (this is a sample, so nothing was sent)")}
                sentClassName="mt-4 text-right text-[11px] tracking-[0.15em] text-[#78716c]"
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    {fields.map((f) => (
                        <div key={f.id} className={f.tall ? "sm:col-span-2" : ""}>
                            <label htmlFor={f.id} className="text-[10px] tracking-[0.2em] text-[#a8a29e]">
                                {f.label}
                            </label>
                            {f.tall ? (
                                <textarea id={f.id} required rows={3} className={`${input} resize-none`} />
                            ) : (
                                <input id={f.id} type={f.type} required className={`${input} h-6`} />
                            )}
                        </div>
                    ))}
                </div>
                <p className="mt-8 text-right">
                    <button type="submit" className="bg-[#1c1917] px-8 py-3 text-[11px] tracking-[0.3em] text-[#fafaf9] hover:opacity-80">
                        {t("送信", "Send")}
                    </button>
                </p>
            </DemoForm>
        </Part>
    );
};

const Footer = () => (
    <Part id="footer" as="footer" className="flex flex-wrap justify-between gap-4 px-8 py-8 text-[10px] tracking-[0.2em] text-[#a8a29e]">
        <span>© Studio Kasumi</span>
        <span>Instagram — Mail</span>
    </Part>
);

const Page: ConceptView["Page"] = ({ lang }) => (
    <Frame>
        <GlobalNav lang={lang} />
        <Breadcrumb lang={lang} />
        <Hero lang={lang} />
        <FilterScope>
            <Tabs lang={lang} />
            <Gallery lang={lang} />
        </FilterScope>
        <Pagination />
        <Stats lang={lang} />
        <Accordion lang={lang} />
        <Form lang={lang} />
        <Footer />
    </Frame>
);

export const studio: ConceptView = {
    Frame,
    Page,
    samples: {
        "global-nav": GlobalNav,
        breadcrumb: ({ lang }) => (
            <div className="py-6">
                <Breadcrumb lang={lang} />
            </div>
        ),
        hero: Hero,
        "cta-button": ({ lang }) => (
            <div className="p-8">
                <CtaButton lang={lang} />
            </div>
        ),
        tabs: ({ lang }) => (
            <div className="py-6">
                <Tabs lang={lang} />
            </div>
        ),
        gallery: Gallery,
        tag: ({ lang }) => (
            <div className="flex gap-4 p-8">
                <Tag label={textFor(lang)("風景", "Landscape")} />
                <Tag label={textFor(lang)("人物", "Portrait")} />
            </div>
        ),
        pagination: () => (
            <div className="pt-8">
                <Pagination />
            </div>
        ),
        stats: Stats,
        accordion: Accordion,
        form: ({ lang }) => (
            <div className="pt-8">
                <Form lang={lang} />
            </div>
        ),
        footer: () => <Footer />,
    },
};
