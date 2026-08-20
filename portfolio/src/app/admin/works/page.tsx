// src/app/admin/works/page.tsx

import type { Metadata } from "next";

import { WorksList } from "@/components/admin/WorksList";
import { listWorksAdmin } from "@/lib/admin/works";

/** 認証を通った後にだけ描画されるため、ここでタイトルを付けても存在は漏れない */
export const metadata: Metadata = {
    title: "TOPカード",
    robots: { index: false, follow: false },
};

/** セッションCookieを読むため、キャッシュさせず毎回サーバーで判定する */
export const dynamic = "force-dynamic";

export default async function AdminWorksPage() {
    const works = await listWorksAdmin();

    return (
        <div className="mx-auto max-w-3xl px-5 py-10">
            <h1 className="mb-2 text-lg tracking-[0.24em] text-white">TOPカード</h1>
            <p className="mb-8 text-xs text-white/40">
                ホーム画面の WORKS に並ぶ5枚のカードです。カテゴリの中身（個々の作品）は
                「ポートフォリオ」から編集します。
            </p>
            <WorksList works={works} />
        </div>
    );
}
