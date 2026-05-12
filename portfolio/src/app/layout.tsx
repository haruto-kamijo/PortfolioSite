// src/app/layout.tsx
import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
    title: "Portfolio | Your Name",
    description: "Space inspired portfolio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja" className="h-full">
        <body className="h-full bg-black text-white antialiased">
        {children}
        </body>
        </html>
    );
}
