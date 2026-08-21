// src/app/not-found.tsx
import Link from "next/link";

/**
 * 共通の 404 ページ。
 *
 * 存在しないパスと、認証されていない /admin の両方がここに来る。
 * 応答を同じにすることで /admin の存在を推測されないようにしている。
 * そのため、ここに「管理画面」を示す文言や分岐を書いてはいけない。
 */
export default function NotFound() {
    return (
        <main className="flex min-h-svh flex-col items-center justify-center px-5 text-center">
            <p className="text-5xl tracking-[0.2em] text-white/80">404</p>
            <p className="mt-6 text-sm text-slate-300">ページが見つかりませんでした</p>

            <Link
                href="/home"
                className="mt-10 rounded-full border border-cyan-200/30 px-6 py-2 text-xs tracking-widest text-white/90 transition-shadow hover:shadow-[0_0_24px_rgba(120,255,255,0.3)]"
            >
                HOME
            </Link>
        </main>
    );
}
