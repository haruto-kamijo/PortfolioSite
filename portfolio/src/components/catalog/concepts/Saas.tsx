// src/components/catalog/concepts/Saas.tsx
import React from "react";
import { Part, textFor } from "@/components/catalog/Part";
import type { Locale } from "@/lib/i18n";
import type { ConceptView } from "./types";

/**
 * Tasklane（グラスモーフィズム）。紫から桃色のグラデーションに、半透明のすりガラスのパネルを重ねる
 */

const SANS = 'system-ui, -apple-system, "Segoe UI", "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", sans-serif';

const Frame: ConceptView["Frame"] = ({ children, className = "" }) => (
    <div
        className={`relative overflow-hidden bg-[#1e1b4b] text-white ${className}`}
        style={{ fontFamily: SANS }}
    >
        {/* 光の玉。すりガラスの向こうでにじんで見えるように、パネルより後ろに置く */}
        <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#7c3aed] opacity-70 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-10 top-1/3 h-56 w-56 rounded-full bg-[#ec4899] opacity-50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-[#06b6d4] opacity-40 blur-3xl" />
        <div className="relative">{children}</div>
    </div>
);

const glass = "rounded-2xl border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(15,10,60,0.35)] backdrop-blur-md";

const Badge = ({ lang }: { lang: Locale }) => (
    <Part id="badge" as="span" className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
        {textFor(lang)("新機能：AI が予定を自動で組みます", "New: AI plans your week")}
    </Part>
);

const CtaButton = ({ lang }: { lang: Locale }) => (
    <Part
        id="cta-button"
        as="span"
        className="inline-block rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#f472b6] px-6 py-3 text-sm font-semibold shadow-[0_8px_24px_rgba(236,72,153,0.45)]"
    >
        {textFor(lang)("無料で始める", "Start for free")}
    </Part>
);

const GlobalNav = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="global-nav" as="header" className="px-4 pt-4">
            <div className={`${glass} flex flex-wrap items-center justify-between gap-3 px-5 py-3`}>
                <p className="flex items-center gap-2 text-sm font-bold">
                    <span className="h-5 w-5 rounded-md bg-gradient-to-br from-[#a78bfa] to-[#f472b6]" />
                    Tasklane
                </p>
                <ul className="flex gap-4 text-xs text-white/75">
                    <li className="text-white">{t("機能", "Features")}</li>
                    <li>{t("料金", "Pricing")}</li>
                    <li>{t("導入事例", "Customers")}</li>
                    <li>{t("ログイン", "Log in")}</li>
                </ul>
            </div>
        </Part>
    );
};

const Hero = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="hero" as="section" className="px-6 py-12 text-center sm:py-16">
            <Badge lang={lang} />
            <p className="mx-auto mt-5 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
                {t("チームのタスクを、", "Every team task,")}
                <br />
                <span className="bg-gradient-to-r from-[#c4b5fd] to-[#f9a8d4] bg-clip-text text-transparent">
                    {t("ひとつの流れに。", "in one flow.")}
                </span>
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm text-white/70">
                {t(
                    "担当・期限・進み具合をひと目で。会議の前に、もう全員が同じ画面を見ています。",
                    "Owners, deadlines and progress at a glance. Everyone is on the same page before the meeting starts."
                )}
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
                <CtaButton lang={lang} />
                <span className="inline-block rounded-xl border border-white/25 px-6 py-3 text-sm">{t("デモを見る", "Watch demo")}</span>
            </div>
            {/* 製品の画面の代わりの絵 */}
            <div className={`${glass} mx-auto mt-10 max-w-lg p-4 text-left`}>
                {[
                    { w: "w-2/3", c: "bg-[#a78bfa]" },
                    { w: "w-1/2", c: "bg-[#f472b6]" },
                    { w: "w-5/6", c: "bg-[#22d3ee]" },
                ].map((row, i) => (
                    <div key={i} className="flex items-center gap-3 border-b border-white/10 py-2.5 last:border-0">
                        <span className="h-3.5 w-3.5 rounded border border-white/40" />
                        <span className={`h-2 rounded-full ${row.c} ${row.w} opacity-80`} />
                    </div>
                ))}
            </div>
        </Part>
    );
};

const Stats = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [
        { value: "12,000+", label: t("導入チーム", "teams") },
        { value: "38%", label: t("会議時間の削減", "fewer meeting hours") },
        { value: "4.8", label: t("アプリの評価", "app rating") },
    ];
    return (
        <Part id="stats" as="section" className="mx-6 grid grid-cols-3 gap-3">
            {items.map((item) => (
                <div key={item.label} className={`${glass} px-3 py-4 text-center`}>
                    <p className="text-xl font-bold sm:text-2xl">{item.value}</p>
                    <p className="mt-1 text-[11px] text-white/65">{item.label}</p>
                </div>
            ))}
        </Part>
    );
};

const FeatureGrid = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [
        { icon: "◎", title: t("ボード", "Boards"), text: t("カードを動かすだけで、進み具合が全員に伝わる。", "Drag a card and everyone sees the progress.") },
        { icon: "◷", title: t("タイムライン", "Timeline"), text: t("期限の重なりを、線の重なりで見つけられる。", "Spot clashing deadlines as overlapping bars.") },
        { icon: "✦", title: t("自動の振り分け", "Auto-assign"), text: t("空いている人に、AI がタスクを提案する。", "AI suggests tasks for whoever has time.") },
    ];
    return (
        <Part id="feature-grid" as="section" className="grid gap-4 px-6 py-12 sm:grid-cols-3">
            {items.map((item) => (
                <div key={item.title} className={`${glass} p-5`}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg">{item.icon}</span>
                    <p className="mt-4 text-sm font-semibold">{item.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/70">{item.text}</p>
                </div>
            ))}
        </Part>
    );
};

const PricingTable = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const plans = [
        { name: "Free", price: "¥0", items: [t("3人まで", "Up to 3 people"), t("ボード 2つ", "2 boards")] },
        { name: "Team", price: "¥980", items: [t("人数無制限", "Unlimited people"), t("タイムライン", "Timeline"), t("自動の振り分け", "Auto-assign")], featured: true },
        { name: "Business", price: "¥1,980", items: [t("SSO", "SSO"), t("監査ログ", "Audit log")] },
    ];
    return (
        <Part id="pricing-table" as="section" className="grid items-center gap-4 px-6 pb-12 sm:grid-cols-3">
            {plans.map((plan) => (
                <div
                    key={plan.name}
                    className={`${glass} p-5 ${plan.featured ? "border-[#f9a8d4]/60 bg-white/20 sm:scale-105" : ""}`}
                >
                    <p className="flex items-center justify-between text-xs font-semibold text-white/80">
                        {plan.name}
                        {plan.featured && (
                            <span className="rounded-full bg-[#f472b6] px-2 py-0.5 text-[10px] text-white">{t("人気", "Popular")}</span>
                        )}
                    </p>
                    <p className="mt-3 text-2xl font-bold">
                        {plan.price}
                        <span className="text-xs font-normal text-white/60"> / {t("人・月", "user/mo")}</span>
                    </p>
                    <ul className="mt-4 space-y-1.5 text-xs text-white/80">
                        {plan.items.map((item) => (
                            <li key={item}>✓ {item}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </Part>
    );
};

const Testimonial = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="testimonial" as="aside" className={`${glass} mx-6 flex items-start gap-4 p-5`}>
            <span className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[#fde68a] to-[#f472b6]" />
            <div>
                <p className="text-sm leading-relaxed">
                    {t(
                        "「朝会が15分で終わるようになりました。誰が何をしているか、もう聞かなくていいので。」",
                        "“Our stand-up now takes 15 minutes. Nobody has to ask who is doing what anymore.”"
                    )}
                </p>
                <p className="mt-2 text-[11px] text-white/60">{t("開発チームのリーダー", "Engineering lead")}</p>
            </div>
        </Part>
    );
};

const Accordion = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const items = [
        { q: t("無料プランに期限はありますか？", "Does the free plan expire?"), a: t("ありません。3人までならずっと無料です。", "No. It stays free for up to three people."), open: true },
        { q: t("途中でプランを変えられますか？", "Can I change plans later?") },
        { q: t("データはどこに保存されますか？", "Where is my data stored?") },
    ];
    return (
        <Part id="accordion" as="section" className="mx-6 my-12 space-y-2">
            {items.map((item) => (
                <div key={item.q} className={`${glass} px-5 py-3`}>
                    <p className="flex items-center justify-between text-sm">
                        {item.q}
                        <span className="text-white/60">{item.open ? "−" : "+"}</span>
                    </p>
                    {item.a && <p className="mt-2 text-xs text-white/70">{item.a}</p>}
                </div>
            ))}
        </Part>
    );
};

const Newsletter = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    return (
        <Part id="newsletter" as="section" className={`${glass} mx-6 mb-10 flex flex-wrap items-center gap-3 p-4`}>
            <p className="min-w-[10rem] flex-1 text-sm">{t("新機能のお知らせを受け取る", "Get product updates")}</p>
            <span className="min-w-[10rem] flex-1 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs text-white/50">you@example.com</span>
            <span className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#4c1d95]">{t("登録", "Subscribe")}</span>
        </Part>
    );
};

const Footer = ({ lang }: { lang: Locale }) => {
    const t = textFor(lang);
    const cols = [
        { title: t("製品", "Product"), items: [t("機能", "Features"), t("料金", "Pricing")] },
        { title: t("会社", "Company"), items: [t("私たちについて", "About"), t("採用", "Careers")] },
        { title: t("サポート", "Support"), items: [t("ヘルプ", "Help"), t("お問い合わせ", "Contact")] },
    ];
    return (
        <Part id="footer" as="footer" className="border-t border-white/15 bg-black/20 px-6 py-8 backdrop-blur">
            <div className="grid grid-cols-3 gap-4 text-xs">
                {cols.map((col) => (
                    <div key={col.title}>
                        <p className="font-semibold">{col.title}</p>
                        <ul className="mt-2 space-y-1 text-white/60">
                            {col.items.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <p className="mt-6 text-[10px] text-white/40">© Tasklane</p>
        </Part>
    );
};

const Page: ConceptView["Page"] = ({ lang }) => (
    <Frame>
        <GlobalNav lang={lang} />
        <Hero lang={lang} />
        <Stats lang={lang} />
        <FeatureGrid lang={lang} />
        <PricingTable lang={lang} />
        <Testimonial lang={lang} />
        <Accordion lang={lang} />
        <Newsletter lang={lang} />
        <Footer lang={lang} />
    </Frame>
);

export const saas: ConceptView = {
    Frame,
    Page,
    samples: {
        "global-nav": GlobalNav,
        hero: Hero,
        badge: ({ lang }) => (
            <div className="p-6">
                <Badge lang={lang} />
            </div>
        ),
        "cta-button": ({ lang }) => (
            <div className="p-6">
                <CtaButton lang={lang} />
            </div>
        ),
        stats: ({ lang }) => (
            <div className="py-6">
                <Stats lang={lang} />
            </div>
        ),
        "feature-grid": FeatureGrid,
        "pricing-table": ({ lang }) => (
            <div className="pt-6">
                <PricingTable lang={lang} />
            </div>
        ),
        testimonial: ({ lang }) => (
            <div className="py-6">
                <Testimonial lang={lang} />
            </div>
        ),
        accordion: Accordion,
        newsletter: ({ lang }) => (
            <div className="pt-6">
                <Newsletter lang={lang} />
            </div>
        ),
        footer: Footer,
    },
};
