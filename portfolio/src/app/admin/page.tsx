// src/app/admin/page.tsx

import type { Metadata } from "next";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { countUnreadContacts } from "@/lib/admin/contacts";
import { listPortfolioItemsAdmin } from "@/lib/admin/portfolio";
import { getSiteContent } from "@/lib/content/getSiteContent";
import { PORTFOLIO_CATEGORIES } from "@/lib/content/types";

/** 認証を通った後にだけ描画されるため、ここでタイトルを付けても存在は漏れない */
export const metadata: Metadata = {
    title: "ダッシュボード",
    robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
    const [unread, content, portfolioItems] = await Promise.all([
        countUnreadContacts(),
        getSiteContent(),
        listPortfolioItemsAdmin(),
    ]);

    const portfolioCount = PORTFOLIO_CATEGORIES.reduce(
        (sum, c) => sum + portfolioItems[c].length,
        0
    );

    return (
        <div className="mx-auto max-w-5xl px-5 py-10">
            <h1 className="mb-8 text-lg tracking-[0.24em] text-white">ダッシュボード</h1>

            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Panel as="li" className="transition-colors hover:border-cyan-200/40">
                    <Link href="/admin/contacts" className="block p-6">
                        <p className="text-sm text-white">受信箱</p>
                        <p className="mt-4 text-2xl text-cyan-200">
                            {unread}
                            <span className="ml-2 text-xs text-white/40">件の未読</span>
                        </p>
                    </Link>
                </Panel>

                <Panel as="li" className="transition-colors hover:border-cyan-200/40">
                    <Link href="/admin/profile" className="block p-6">
                        <p className="text-sm text-white">プロフィール</p>
                        <p className="mt-4 text-xs text-white/40">
                            名前・肩書き・学年などを編集
                        </p>
                    </Link>
                </Panel>

                <Panel as="li" className="transition-colors hover:border-cyan-200/40">
                    <Link href="/admin/works" className="block p-6">
                        <p className="text-sm text-white">TOPカード</p>
                        <p className="mt-4 text-2xl text-cyan-200">
                            {content.works.length}
                            <span className="ml-2 text-xs text-white/40">件</span>
                        </p>
                    </Link>
                </Panel>

                <Panel as="li" className="transition-colors hover:border-cyan-200/40">
                    <Link href="/admin/portfolio" className="block p-6">
                        <p className="text-sm text-white">ポートフォリオ</p>
                        <p className="mt-4 text-2xl text-cyan-200">
                            {portfolioCount}
                            <span className="ml-2 text-xs text-white/40">件</span>
                        </p>
                    </Link>
                </Panel>
            </ul>

            {/* Firestore が空のうちは既定値で表示されている。その状態を管理画面で分かるようにしておく */}
            {content.source === "defaults" && (
                <Panel className="mt-8 p-6">
                    <p className="text-xs leading-relaxed text-amber-200/80">
                        公開ページは現在、コード内の既定値で表示されています。
                        プロフィールや作品を保存すると Firestore の内容が使われるようになります。
                    </p>
                </Panel>
            )}
        </div>
    );
}
