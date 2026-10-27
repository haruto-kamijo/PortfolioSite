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
            {/* どの言語のページから来たかは分からない（分岐も作れない）ため、日英を併記する */}
            <p className="mt-6 text-sm text-slate-300">ページが見つかりませんでした</p>
            <p lang="en" className="mt-1 text-xs text-slate-400">Page not found</p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link
                    href="/home"
                    className="rounded-full border border-cyan-200/30 px-6 py-2.5 text-xs tracking-widest text-white/90 transition-shadow hover:shadow-[0_0_24px_rgba(120,255,255,0.3)]"
                >
                    ホームへ
                </Link>
                <Link
                    href="/en/home"
                    hrefLang="en"
                    lang="en"
                    className="rounded-full border border-white/20 px-6 py-2.5 text-xs tracking-widest text-white/70 transition-colors hover:border-white/40 hover:text-white"
                >
                    HOME (EN)
                </Link>
            </div>
        </main>
    );
}
