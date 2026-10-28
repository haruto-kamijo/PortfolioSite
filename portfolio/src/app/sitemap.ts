// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { LOCALES, localizePath } from "@/lib/i18n";
import { site } from "@/lib/site";

/**
 * 公開ページのみ。/admin と /login は載せない。
 * 日本語版と英語版を両方載せ、互いが同じページの別言語版であることを alternates で伝える。
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        { path: "/", priority: 1 },
        { path: "/home", priority: 0.9 },
        { path: "/about", priority: 0.7 },
        { path: "/portfolio", priority: 0.7 },
        { path: "/contact", priority: 0.6 },
    ];

    return routes.flatMap(({ path, priority }) =>
        LOCALES.map((lang) => ({
            url: `${site.url}${localizePath(path, lang)}`,
            changeFrequency: "monthly" as const,
            priority,
            alternates: {
                languages: Object.fromEntries(
                    LOCALES.map((l) => [l, `${site.url}${localizePath(path, l)}`])
                ),
            },
        }))
    );
}
