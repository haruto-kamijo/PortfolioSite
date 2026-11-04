// src/components/catalog/Interactive.tsx
"use client";

import React, { createContext, useContext, useState } from "react";

/**
 * 見本のページの中で動く部品。見本はサーバーで描くので、押して変わるところだけをここに置く。
 * 見た目は見本ごとに違うので、クラスは呼ぶ側から文字列で渡す（サーバーからは関数を渡せないため）。
 *
 * どれも見本の中だけで完結し、URL も変えず、どこにも送らない。
 * パーツの名前を見るモードとパーツ図鑑では、見本の中身が inert になるので、ここの部品は動かない
 */

/**
 * 見本のページ（CatalogViewer の枠）の中から、そのパーツの最初の1つを探して見える位置まで動かす。
 * キーボードで押した人が続きから進めるよう、フォーカスも移す
 */
const scrollToPart = (from: HTMLElement, target: string) => {
    // タブで絞り込まれて隠れているもの（大きさが無いもの）は飛ばす
    const el = Array.from(
        from.closest("[data-catalog-page]")?.querySelectorAll<HTMLElement>(`[data-part="${CSS.escape(target)}"]`) ?? []
    ).find((candidate) => candidate.getClientRects().length > 0);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
};

type Classes = { className?: string; itemClassName?: string; activeClassName?: string; inactiveClassName?: string };

/**
 * グローバルナビ。押した項目が選ばれた見た目になり、target があればそのパーツまで動く
 */
export const JumpNav = ({
    items,
    defaultIndex = 0,
    className,
    itemClassName = "",
    activeClassName = "",
    inactiveClassName = "",
}: { items: { label: string; target?: string }[]; defaultIndex?: number } & Classes) => {
    const [active, setActive] = useState(defaultIndex);
    return (
        <ul className={className}>
            {items.map((item, i) => (
                <li key={item.label} className="flex">
                    <button
                        type="button"
                        aria-current={i === active ? "true" : undefined}
                        className={`${itemClassName} ${i === active ? activeClassName : inactiveClassName}`}
                        onClick={(e) => {
                            setActive(i);
                            if (item.target) scrollToPart(e.currentTarget, item.target);
                        }}
                    >
                        {item.label}
                    </button>
                </li>
            ))}
        </ul>
    );
};

/** 押すと、ページの中の target のパーツまで動くボタン（CTA ボタンなど） */
export const JumpButton = ({ target, className, children }: { target: string; className?: string; children: React.ReactNode }) => (
    <button type="button" className={className} onClick={(e) => scrollToPart(e.currentTarget, target)}>
        {children}
    </button>
);

const FilterContext = createContext<{ value: string; setValue: (value: string) => void } | null>(null);

/** タブと、タブで絞り込む中身をつなぐ。FilterTabs で選んだ値に合う FilterItem だけを出す */
export const FilterScope = ({ children }: { children: React.ReactNode }) => {
    const [value, setValue] = useState("all");
    return <FilterContext.Provider value={{ value, setValue }}>{children}</FilterContext.Provider>;
};

/**
 * タブ。FilterScope の中では中身を絞り込み、外（パーツ図鑑の単体の見本）では選んだ見た目だけが変わる。
 * 値 "all" はすべてを出す
 */
export const FilterTabs = ({
    items,
    itemClassName = "",
    activeClassName = "",
    inactiveClassName = "",
}: { items: { label: string; value: string }[] } & Omit<Classes, "className">) => {
    const scope = useContext(FilterContext);
    const [local, setLocal] = useState("all");
    const value = scope?.value ?? local;
    const setValue = scope?.setValue ?? setLocal;
    return (
        <>
            {items.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    aria-pressed={item.value === value}
                    className={`${itemClassName} ${item.value === value ? activeClassName : inactiveClassName}`}
                    onClick={() => setValue(item.value)}
                >
                    {item.label}
                </button>
            ))}
        </>
    );
};

/** タブで絞り込まれる中身の1つ。選ばれた値が "all" か、自分の value と同じときだけ出る */
export const FilterItem = ({
    value,
    as: Tag = "div",
    className = "",
    children,
}: {
    value: string;
    as?: "div" | "figure";
    className?: string;
    children: React.ReactNode;
}) => {
    const selected = useContext(FilterContext)?.value ?? "all";
    // hidden 属性は、className の flex・grid などに負けて消えないことがあるので、クラスで隠す
    return <Tag className={`${className} ${selected !== "all" && selected !== value ? "hidden" : ""}`}>{children}</Tag>;
};

/**
 * 番号のページ送り。今のページの前後と、最初・最後のページを出し、間は … で詰める。
 * 端の矢印は、disabled にするとフォーカスが外れるので aria-disabled にして、押しても何もしない
 */
export const NumberPager = ({
    total,
    initial = 1,
    itemClassName = "",
    activeClassName = "",
    inactiveClassName = "",
    prevLabel,
    nextLabel,
}: { total: number; initial?: number; prevLabel: string; nextLabel: string } & Omit<Classes, "className">) => {
    const [page, setPage] = useState(initial);
    const shown = Array.from(new Set([1, page - 1, page, page + 1, total])).filter((n) => n >= 1 && n <= total);
    const cells: (number | "gap")[] = [];
    shown.forEach((n, i) => {
        if (i > 0 && n - shown[i - 1] > 1) cells.push("gap");
        cells.push(n);
    });
    return (
        <>
            <button type="button" aria-label={prevLabel} aria-disabled={page === 1} className={`${itemClassName} ${inactiveClassName}`} onClick={() => page > 1 && setPage(page - 1)}>
                ←
            </button>
            {cells.map((cell, i) =>
                cell === "gap" ? (
                    <span key={`gap-${i}`} aria-hidden="true" className={`${itemClassName} ${inactiveClassName}`}>
                        …
                    </span>
                ) : (
                    <button
                        key={cell}
                        type="button"
                        aria-current={cell === page ? "page" : undefined}
                        className={`${itemClassName} ${cell === page ? activeClassName : inactiveClassName}`}
                        onClick={() => setPage(cell)}
                    >
                        {cell}
                    </button>
                )
            )}
            <button type="button" aria-label={nextLabel} aria-disabled={page === total} className={`${itemClassName} ${inactiveClassName}`} onClick={() => page < total && setPage(page + 1)}>
                →
            </button>
        </>
    );
};

/** 「01 / 06」の形のページ送り。端では、その向きのボタンを押せなくする（disabled にするとフォーカスが外れるので aria-disabled にする） */
export const CounterPager = ({
    total,
    activeClassName = "",
    inactiveClassName = "",
}: { total: number } & Pick<Classes, "activeClassName" | "inactiveClassName">) => {
    const [page, setPage] = useState(1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
        <>
            <button type="button" aria-disabled={page === 1} className={page === 1 ? inactiveClassName : activeClassName} onClick={() => page > 1 && setPage(page - 1)}>
                ← Prev
            </button>
            <span aria-live="polite">
                <span className={activeClassName}>{pad(page)}</span> / {pad(total)}
            </span>
            <button type="button" aria-disabled={page === total} className={page === total ? inactiveClassName : activeClassName} onClick={() => page < total && setPage(page + 1)}>
                Next →
            </button>
        </>
    );
};

/**
 * 見本のフォーム。送信しても、どこにも送らずに sentMessage を出すだけにする
 */
export const DemoForm = ({
    className,
    sentMessage,
    sentClassName,
    children,
}: {
    className?: string;
    sentMessage: string;
    sentClassName?: string;
    children: React.ReactNode;
}) => {
    const [sent, setSent] = useState(false);
    return (
        <form
            className={className}
            onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
            }}
        >
            {children}
            {/* 読み上げに届くよう、知らせる場所は最初から置いておき、中身だけを足す */}
            <p role="status" className={sent ? sentClassName : "sr-only"}>
                {sent ? sentMessage : ""}
            </p>
        </form>
    );
};
