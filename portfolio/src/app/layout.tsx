// src/app/layout.tsx
import type { Metadata } from "next";
import "./global.css";
import { SpaceSceneProvider } from "@/components/space/SpaceSceneProvider";
import { SpaceBackground } from "@/components/space/SpaceBackground";
import { site } from "@/lib/site";

export const metadata: Metadata = {
    title: {
        default: `${site.name} | Portfolio`,
        template: `%s | ${site.name}`,
    },
    description: site.description,
    metadataBase: new URL(site.url),
    icons: { icon: "/logo.png", apple: "/logo.png" },
    openGraph: {
        type: "website",
        locale: "ja_JP",
        siteName: `${site.name} Portfolio`,
        title: `${site.name} | Portfolio`,
        description: site.description,
        url: site.url,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja" className="h-full">
        {/* 背景色は html 側に持たせている（global.css 参照）。
            ここで bg を付けると背景のCanvasが隠れる。 */}
        <body className="min-h-full text-white antialiased">
        {/*
              星空Canvasはルートに1つだけ置き、全ページで共有する。
              ページ遷移でWebGLコンテキストを作り直さないため世界観が途切れない。
            */}
        <SpaceSceneProvider>
            <SpaceBackground />
            {children}
        </SpaceSceneProvider>
        </body>
        </html>
    );
}
