// src/app/robots.ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * robots.txt は誰でも読めるファイルなので、隠したいパス（/admin）は書かない。
 * Disallow に書くと逆に存在を教えてしまう。
 * /admin は未認証だと 404 を返すためクロールされず、/login は noindex を付けている。
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: "*", allow: "/" }],
        sitemap: `${site.url}/sitemap.xml`,
    };
}
