// src/app/admin/portfolio/page.tsx

import type { Metadata } from "next";

import { PortfolioItemsManager } from "@/components/admin/PortfolioItemsManager";
import { listPortfolioItemsAdmin } from "@/lib/admin/portfolio";

/** 認証を通った後にだけ描画されるため、ここでタイトルを付けても存在は漏れない */
export const metadata: Metadata = {
    title: "ポートフォリオ",
    robots: { index: false, follow: false },
};

/** セッションCookieを読むため、キャッシュさせず毎回サーバーで判定する */
export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
    const items = await listPortfolioItemsAdmin();

    return (
        <div className="mx-auto max-w-3xl px-5 py-10">
            <h1 className="mb-2 text-lg tracking-[0.24em] text-white">ポートフォリオ</h1>
            <p className="mb-8 text-xs text-white/40">
                /portfolio ページに表示される、カテゴリごとの個々の作品を管理します。
            </p>
            <PortfolioItemsManager items={items} />
        </div>
    );
}
