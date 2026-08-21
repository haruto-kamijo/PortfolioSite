// src/components/admin/LoginForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

/**
 * ログイン画面。
 *
 * ここでは「管理画面」という語を出さない。このURLを踏んだだけの人に
 * 管理画面の存在を教えないため。
 *
 * クライアントの Firebase セッションはそのまま保持する（CMS が Firestore と Storage に
 * 直接書き込む際に、セキュリティルールが request.auth を必要とするため）。
 * それとは別に、ID トークンをサーバーへ送ってセッションCookieを発行させる。
 */
export const LoginForm = () => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const signIn = async () => {
        setBusy(true);
        setError(null);

        const auth = getFirebaseAuth();
        if (!auth) {
            setError("設定が読み込めませんでした");
            setBusy(false);
            return;
        }

        try {
            const cred = await signInWithPopup(auth, new GoogleAuthProvider());
            const idToken = await cred.user.getIdToken();

            const res = await fetch("/api/admin/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (!res.ok) {
                // 権限のないアカウントでログインした場合、クライアント側のセッションも消しておく
                await auth.signOut().catch(() => undefined);
                setError("このアカウントではご利用いただけません");
                setBusy(false);
                return;
            }

            router.replace("/admin");
        } catch (err) {
            // ポップアップを閉じただけの場合はエラー表示しない
            const code = (err as { code?: string } | null)?.code ?? "";
            if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
                setError("ログインできませんでした");
            }
            setBusy(false);
        }
    };

    return (
        <div className="text-center">
            <button
                type="button"
                onClick={signIn}
                disabled={busy}
                className="rounded-full border border-cyan-200/30 px-8 py-3 text-xs tracking-widest text-white shadow-[0_0_20px_rgba(120,255,255,0.2)] transition-shadow hover:shadow-[0_0_30px_rgba(120,255,255,0.4)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
                {busy ? "処理中..." : "Google でサインイン"}
            </button>

            <p className="mt-6 min-h-5 text-sm text-rose-300" role="alert" aria-live="polite">
                {error ?? ""}
            </p>
        </div>
    );
};
