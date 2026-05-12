// src/app/home/page.tsx
"use client";

import Link from "next/link";

export default function Home() {
    return (
        <main className="min-h-screen bg-black text-white px-6 md:px-16 py-16">
            <h1 className="text-3xl font-semibold">Home (Coming Soon)</h1>
            <p className="mt-3 text-slate-300">
                ここから本編のポートフォリオを作っていきます。
            </p>

            <Link
                href="/"
                className="mt-10 inline-flex rounded-full border border-white/20 px-5 py-2 text-sm text-white/90 hover:border-white/35 hover:bg-white/5 transition"
            >
                ← Back to Start
            </Link>
        </main>
    );
}
