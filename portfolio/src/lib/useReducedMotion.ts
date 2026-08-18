// src/lib/useReducedMotion.ts
"use client";

import { useEffect, useState } from "react";

/**
 * OS/ブラウザの「視差効果を減らす」設定を返す。
 * 長尺のワープ演出や全画面フラッシュは光感受性への配慮が必要なため、
 * この値が true のときは演出を省略して即座に遷移させる。
 */
export const useReducedMotion = () => {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduced(mql.matches);

        const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return reduced;
};
