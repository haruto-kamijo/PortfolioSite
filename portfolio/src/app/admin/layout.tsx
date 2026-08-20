// src/app/admin/layout.tsx
import { notFound } from "next/navigation";
import React from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminUser } from "@/lib/admin/session";

/** セッションCookieを読むため、キャッシュさせず毎回サーバーで判定する */
export const dynamic = "force-dynamic";

/**
 * ここに metadata を書いてはいけない。
 * レイアウトの metadata は notFound() を投げた場合にも適用されるため、
 * 404 応答に <title>Admin</title> が載って「このパスに管理画面がある」と分かってしまう。
 * タイトルは各ページ側（認証を通った後にだけ描画される）で設定する。
 */

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getAdminUser();

    // 未認証はログイン画面へ redirect せず 404 を返す。
    // redirect すると存在が露見するため。
    if (!user) notFound();

    return <AdminShell email={user.email}>{children}</AdminShell>;
}
