// src/components/analytics/CloudflareAnalytics.tsx
"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isCatalogFramePath } from "@/lib/catalog/widths";
import { analytics, site } from "@/lib/site";

/**
 * Cloudflare Web Analytics の計測用スクリプト。ページの閲覧数を数える（Cookie は使わない）。
 * 本番のドメインで開いたときだけ読み込む（手元の開発・E2E テストの閲覧を数えないように）。
 * カタログの iframe の中のページ（/catalog-frame）は、親のページと二重に数えるので読み込まない。
 * ページを移っても数えられるよう、spa を有効にする（Next.js の画面の切り替えは history の書き換えなので）
 */
export const CloudflareAnalytics = () => {
    const pathname = usePathname();
    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        setEnabled(!!analytics.cloudflareToken && window.location.hostname === new URL(site.url).hostname);
    }, []);

    if (!enabled || isCatalogFramePath(pathname)) return null;
    return (
        <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token: analytics.cloudflareToken, spa: true })}
        />
    );
};
