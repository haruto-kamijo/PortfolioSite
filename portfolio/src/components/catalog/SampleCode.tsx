// src/components/catalog/SampleCode.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * HTML に書き出さない属性。見本を動かすための印（data-*・inert）と、React がその場で作る id（:r1: の形）を指す属性。
 * aria-pressed などの状態を表す属性や、disabled などは残す（使う人が状態まで写せるように）
 */
const isSkipped = (attr: Attr) => attr.name.startsWith("data-") || attr.name === "inert" || /(^|\s):r[0-9a-z]+:/.test(attr.value);

/** 閉じタグの無い要素 */
const VOID = new Set(["area", "br", "col", "hr", "img", "input", "source", "wbr"]);

/** 文章はこれより長ければ切る */
const MAX_TEXT = 40;

/** これより長いコードは後ろを省く */
const MAX_LINES = 150;

const escapeText = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s: string) => escapeText(s).replace(/"/g, "&quot;");

const shorten = (s: string) => {
    const text = s.replace(/\s+/g, " ").trim();
    return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
};

const openTag = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    // 読みやすいよう class を先頭にし、ほかは描かれた順に並べる
    const attrs = Array.from(el.attributes)
        .filter((attr) => !isSkipped(attr))
        .sort((a, b) => Number(b.name === "class") - Number(a.name === "class"))
        .map((attr) => (attr.value === "" ? ` ${attr.name}` : ` ${attr.name}="${escapeAttr(attr.value)}"`));
    return `<${tag}${attrs.join("")}>`;
};

/** 要素を、字下げした HTML の行にする。SVG の中身は省き、文章は短くする */
const toLines = (el: Element, depth: number, lines: string[]) => {
    const pad = "  ".repeat(depth);
    const tag = el.tagName.toLowerCase();
    if (VOID.has(tag)) {
        lines.push(pad + openTag(el));
        return;
    }
    if (tag === "svg") {
        lines.push(`${pad}${openTag(el)}…</svg>`);
        return;
    }
    const children = Array.from(el.childNodes).filter(
        (n) => n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
    );
    // 中が文章だけなら1行にまとめる
    if (children.every((n) => n.nodeType === Node.TEXT_NODE)) {
        lines.push(`${pad}${openTag(el)}${escapeText(shorten(el.textContent ?? ""))}</${tag}>`);
        return;
    }
    lines.push(pad + openTag(el));
    for (const child of children) {
        if (child.nodeType === Node.TEXT_NODE) lines.push(pad + "  " + escapeText(shorten(child.textContent ?? "")));
        else toLines(child as Element, depth + 1, lines);
    }
    lines.push(`${pad}</${tag}>`);
};

export const elementToHtml = (el: Element) => {
    const lines: string[] = [];
    toLines(el, 0, lines);
    return lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES), "…"].join("\n") : lines.join("\n");
};

/**
 * パーツ図鑑の見本の下に置く「コードを見る」。開いたときに、同じ見本の枠（data-sample）の中で描かれた
 * パーツ（data-part）を読み、class 付きの HTML にして出す。描いたものを読むので、見た目と必ず一致する。
 * 見本の背景や書体は、見本のページ全体（Frame）が持っているので、ここには入らない
 */
export const SampleCode = ({
    partId,
    texts,
}: {
    partId: string;
    texts: { show: string; note: string; copy: string; copied: string; copyFailed: string; label: string };
}) => {
    const ref = useRef<HTMLDetailsElement>(null);
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

    const onToggle = () => {
        const details = ref.current;
        if (!details?.open || code) return;
        const sample = details.closest("article")?.querySelector("[data-sample]");
        const part = sample?.querySelector(`[data-part="${CSS.escape(partId)}"]`) ?? sample?.firstElementChild;
        if (part) setCode(elementToHtml(part));
    };

    const timer = useRef(0);
    const copy = async () => {
        // 続けて押しても読み上げるよう、いったん空にしてから知らせ、しばらくしたら消す
        window.clearTimeout(timer.current);
        setStatus("idle");
        let next: "copied" | "failed" = "copied";
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            next = "failed";
        }
        window.requestAnimationFrame(() => setStatus(next));
        timer.current = window.setTimeout(() => setStatus("idle"), 3000);
    };
    useEffect(() => () => window.clearTimeout(timer.current), []);

    return (
        <details ref={ref} onToggle={onToggle} className="group border-t border-white/10">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs tracking-wider text-white/60 hover:text-white [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="inline-block transition-transform group-open:rotate-90">
                    ›
                </span>
                {texts.show}
            </summary>
            <div className="px-4 pb-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-white/40">{texts.note}</p>
                    <div className="flex items-center gap-2">
                        <span role="status" className="text-[11px] text-cyan-200/80">
                            {status === "copied" ? texts.copied : status === "failed" ? texts.copyFailed : ""}
                        </span>
                        <button
                            type="button"
                            onClick={copy}
                            disabled={!code}
                            className="rounded-full border border-white/15 px-3 py-1 text-[11px] tracking-wider text-white/70 transition-colors hover:border-cyan-200/40 hover:text-cyan-200 disabled:opacity-40"
                        >
                            {texts.copy}
                        </button>
                    </div>
                </div>
                {/* 長いので枠の中でスクロールする。キーボードでも動かせるよう止まれるようにし、名前を付けるため region にする */}
                <pre
                    tabIndex={0}
                    role="region"
                    aria-label={texts.label}
                    className="max-h-96 overflow-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-slate-200"
                >
                    <code>{code}</code>
                </pre>
            </div>
        </details>
    );
};
