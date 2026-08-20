// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** 公開ページのみ。/admin と /login は載せない */
export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        { path: "/", priority: 1 },
        { path: "/home", priority: 0.9 },
        { path: "/about", priority: 0.7 },
        { path: "/portfolio", priority: 0.7 },
        { path: "/contact", priority: 0.6 },
    ];

    return routes.map(({ path, priority }) => ({
        url: `${site.url}${path}`,
        changeFrequency: "monthly",
        priority,
    }));
}
