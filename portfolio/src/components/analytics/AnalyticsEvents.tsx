// src/components/analytics/AnalyticsEvents.tsx
"use client";

import { useEffect } from "react";
import { externalKey } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { readSelectedTags, tagKey } from "@/lib/content/tags";

/** /portfolio と /en/portfolio */
const isPortfolioPath = (pathname: string) => /^(?:\/en)?\/portfolio\/?$/.test(pathname);

/**
 * ページの中のリンクを押したときに、外へのリンクとタグの絞り込みを数える（本編のページだけに置く）。
 * リンクごとに印を付けずに済むよう、ページ全体で押されたリンクを見て判断する。
 * 中クリック（新しいタブで開く）も数える
 */
export const AnalyticsEvents = () => {
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (e.type === "auxclick" && e.button !== 1) return;
            const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
            if (!(a instanceof HTMLAnchorElement)) return;

            const external = externalKey(a.href, window.location.hostname);
            if (external) {
                trackEvent("external", external);
                return;
            }

            // タグの絞り込みは、押したリンクで新しく選ばれるタグを数える（外すほうは数えない）
            const url = new URL(a.href);
            if (url.origin !== window.location.origin || !isPortfolioPath(url.pathname)) return;
            const current = new Set(readSelectedTags(new URLSearchParams(window.location.search).getAll("tag")).map(tagKey));
            for (const tag of readSelectedTags(url.searchParams.getAll("tag"))) {
                if (!current.has(tagKey(tag))) trackEvent("tag", tag);
            }
        };
        // Next.js の Link は押されるとすぐページを移るので、その前に見られるよう capture で受ける
        document.addEventListener("click", onClick, true);
        document.addEventListener("auxclick", onClick, true);
        return () => {
            document.removeEventListener("click", onClick, true);
            document.removeEventListener("auxclick", onClick, true);
        };
    }, []);
    return null;
};
