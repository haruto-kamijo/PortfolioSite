// src/app/admin/profile/page.tsx

import type { Metadata } from "next";

import { ProfileForm } from "@/components/admin/ProfileForm";
import { getSiteContent } from "@/lib/content/getSiteContent";

/** 認証を通った後にだけ描画されるため、ここでタイトルを付けても存在は漏れない */
export const metadata: Metadata = {
    title: "プロフィール",
    robots: { index: false, follow: false },
};

/** セッションCookieを読むため、キャッシュさせず毎回サーバーで判定する */
export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
    const content = await getSiteContent();

    return (
        <div className="mx-auto max-w-3xl px-5 py-10">
            <h1 className="mb-8 text-lg tracking-[0.24em] text-white">プロフィール</h1>
            <ProfileForm initial={content.profile} />
        </div>
    );
}
