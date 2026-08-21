// src/app/login/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Panel } from "@/components/ui/Panel";
import { getAdminUser } from "@/lib/admin/session";

/** 検索結果に出さない。サイトからもリンクしない */
export const metadata: Metadata = {
    title: "Sign in",
    robots: { index: false, follow: false },
};

/** セッションCookieを読むため、キャッシュさせず毎回サーバーで判定する */
export const dynamic = "force-dynamic";

export default async function LoginPage() {
    // 有効なセッションが既にあるなら、サインインボタンを経由せず /admin へ
    const user = await getAdminUser();
    if (user) redirect("/admin");

    return (
        <main className="flex min-h-svh items-center justify-center px-5">
            <Panel className="w-full max-w-sm p-10">
                <p className="mb-8 text-center text-[11px] tracking-[0.32em] text-cyan-100/50">
                    SIGN IN
                </p>
                <LoginForm />
            </Panel>
        </main>
    );
}
