// src/components/catalog/HashHighlight.tsx
"use client";

import { useEffect } from "react";

/**
 * URL の #<id> の要素に data-highlight を付ける。
 * CSS の :target は、Next のページ遷移（history.pushState）では更新されないため、こちらで付け直す
 */
export const HashHighlight = () => {
    useEffect(() => {
        let current: Element | null = null;
        const apply = () => {
            current?.removeAttribute("data-highlight");
            const id = decodeURIComponent(window.location.hash.slice(1));
            current = id ? document.getElementById(id) : null;
            current?.setAttribute("data-highlight", "");
        };
        // 別のページから移ってきたときは、この effect のあとに URL が書き換わることがあるので、少し待ってから読む
        const timer = window.setTimeout(apply, 0);
        window.addEventListener("hashchange", apply);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("hashchange", apply);
            current?.removeAttribute("data-highlight");
        };
    }, []);
    return null;
};
