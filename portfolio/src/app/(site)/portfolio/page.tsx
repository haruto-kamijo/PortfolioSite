// src/app/(site)/portfolio/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getPortfolioItems } from "@/lib/content/getPortfolioItems";
import {
    PORTFOLIO_CATEGORIES,
    PORTFOLIO_CATEGORY_LABELS,
    PortfolioCategory,
} from "@/lib/content/types";

export const metadata: Metadata = {
    title: "Portfolio",
    description: "上條遥都の制作物一覧。Webサイト・ゲーム・3Dモデル・写真。",
};

/**
 * searchParams(?tab=) を読むため Next.js は自動的に完全動的レンダリングにする
 * （revalidate を指定しても効かないため書かない）。
 * その代わり home の WORKS カードから該当タブへ直接ディープリンクできる。
 * 個人サイトの規模では毎回 Firestore を読みに行っても負荷上の問題はない。
 */

const isCategory = (value: string | undefined): value is PortfolioCategory =>
    !!value && (PORTFOLIO_CATEGORIES as readonly string[]).includes(value);

export default async function PortfolioPage({
                                                 searchParams,
                                             }: {
    searchParams: { tab?: string };
}) {
    const items = await getPortfolioItems();
    const category = isCategory(searchParams.tab) ? searchParams.tab : "sites";
    const list = items[category];

    return (
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
            <SectionTitle en="PORTFOLIO" ja="制作物" />

            {/* タブ。クエリパラメータでの遷移なのでJS無しでも動く */}
            <nav className="mb-10 flex flex-wrap gap-2" aria-label="カテゴリ">
                {PORTFOLIO_CATEGORIES.map((c) => {
                    const active = c === category;
                    return (
                        <Link
                            key={c}
                            href={`/portfolio?tab=${c}`}
                            aria-current={active ? "page" : undefined}
                            className={`rounded-full border px-4 py-1.5 text-xs tracking-widest transition-colors ${
                                active
                                    ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-200"
                                    : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                            }`}
                        >
                            {PORTFOLIO_CATEGORY_LABELS[c].en}
                        </Link>
                    );
                })}
            </nav>

            {list.length === 0 ? (
                <Panel className="p-10 text-center">
                    <p className="text-sm text-white/50">Coming soon...</p>
                </Panel>
            ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((item) => {
                        const body = (
                            <>
                                <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
                                    {item.coverUrl ? (
                                        <Image
                                            src={item.coverUrl}
                                            alt=""
                                            width={400}
                                            height={240}
                                            className="h-full w-full object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <span className="text-[11px] text-white/25">画像なし</span>
                                    )}
                                </div>
                                <p className="mt-4 text-base text-white">{item.title}</p>
                                {item.caption && (
                                    <p className="mt-2 text-xs text-slate-400">{item.caption}</p>
                                )}
                            </>
                        );

                        return (
                            <Panel
                                as="li"
                                key={item.id}
                                className={item.href ? "transition-colors hover:border-cyan-200/40" : ""}
                            >
                                {item.href ? (
                                    <a
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block p-5"
                                    >
                                        {body}
                                    </a>
                                ) : (
                                    <div className="p-5">{body}</div>
                                )}
                            </Panel>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
