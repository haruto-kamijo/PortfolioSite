// src/lib/analytics/track.ts

import type { EventType } from "./events";

/**
 * 操作を 1 回数える（クライアント専用）。/api/events に送るだけで、結果は待たない。
 * ページを移る直前（外へのリンクを押したときなど）でも届くよう、sendBeacon を使う。
 * 本文は文字列のまま送る（text/plain になる）。application/json の Blob は、古いブラウザの sendBeacon で例外になるため
 */
export const trackEvent = (type: EventType, key: string) => {
    try {
        const body = JSON.stringify({ type, key });
        if (navigator.sendBeacon?.("/api/events", body)) return;
        void fetch("/api/events", { method: "POST", body, keepalive: true }).catch(() => undefined);
    } catch {
        // 数えられなくても、ページの操作には関わらない
    }
};
