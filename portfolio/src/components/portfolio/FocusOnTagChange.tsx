// src/components/portfolio/FocusOnTagChange.tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * /portfolio でタグの選択が変わったら、結果の件数の文（絞り込みを外したときはタグの列の見出し）へ
 * 画面を動かし、キーボードのフォーカスも移す。押したタグのリンクは描き直されて消えるので、
 * そのままだとフォーカスがページの先頭に落ち、読み上げにも絞り込みが効いたことが伝わらないため。
 *
 * タグのリンクは scroll={false} にして、Next.js がページの先頭へ戻すのを止めている。
 * 開いた直後（URL を直接開いたとき・ほかのページから来たとき）は何もしない
 */
export const FocusOnTagChange = ({ selected, targetId }: { selected: string; targetId: string }) => {
    const previous = useRef(selected);
    useEffect(() => {
        if (previous.current === selected) return;
        previous.current = selected;
        // 絞り込みを外したときは、押したリンクが残っていれば（タブなど）そのままにする
        const lost = !document.activeElement || document.activeElement === document.body;
        if (!selected && !lost) return;
        const el = document.getElementById(targetId);
        if (!el) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
        el.focus({ preventScroll: true });
    }, [selected, targetId]);
    return null;
};
