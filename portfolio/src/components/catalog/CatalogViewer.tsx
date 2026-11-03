// src/components/catalog/CatalogViewer.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type PartLabel = { id: string; name: string; sub: string; href: string };

type Box = { top: number; left: number; width: number; height: number };

type Mode = "page" | "parts";

/**
 * デザインカタログの見本のページを、ブラウザの枠に入れて表示する。見方は2つあり、枠の上のボタンで切り替える。
 *
 * ページを操作するモード（既定）
 * - 見本の中のボタン・タブ・アコーディオン・フォームが、ページの中で動く（Interactive.tsx）。図鑑へは移らない
 *
 * パーツの名前を見るモード
 * - パーツ（data-part の付いた要素）を指すと、枠と名前を出す
 * - クリックするとパーツ図鑑のその項目へ移る。タッチでは1回目のタップで名前を出し、同じパーツをもう一度タップで移る。
 *   見本の中の部品が動かないよう、中身は inert にする（指しているパーツは位置から探す）
 * - ?part=<id> 付きで開くと、このモードになり、そのパーツを囲んで見える位置までスクロールする（図鑑の「ページで見る」から来たとき）
 * - このモードのあいだは URL に ?view=parts を付け、図鑑へ移って戻ってきても、このモードのままにする
 *
 * どちらのモードでも、横の一覧を指すと、そのパーツをページの中で全部囲む（キーボードではフォーカスで同じことが起きる）。
 * 一覧から外れると ?part= の囲みに戻る
 */
export const CatalogViewer = ({
    domain,
    parts,
    texts,
    children,
}: {
    domain: string;
    parts: PartLabel[];
    texts: {
        previewLabel: string;
        modeLabel: string;
        modePage: string;
        modeParts: string;
        hintPage: string;
        hintPointer: string;
        hintTouch: string;
        partsOnPage: string;
        openInParts: string;
    };
    children: React.ReactNode;
}) => {
    const router = useRouter();
    const stageRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const pointerType = useRef<string>("mouse");

    const [mode, setMode] = useState<Mode>("page");
    /** 指している1つの要素（パーツの名前を見るモードのときだけ） */
    const [hovered, setHovered] = useState<HTMLElement | null>(null);
    /** ?part= で選んだパーツ。一覧から外れたら（mouseleave・blur）、これに戻す */
    const [pinnedId, setPinnedId] = useState<string | null>(null);
    /** 横の一覧で指しているパーツ */
    const [listId, setListId] = useState<string | null>(null);
    /** ページの中の同じパーツを全部囲むもの */
    const selectedId = listId ?? (mode === "parts" ? pinnedId : null);
    const [boxes, setBoxes] = useState<{ id: string; box: Box }[]>([]);
    /** 指を使う機器か。(hover: none) の機器に加え、タッチもできるノート PC で指を使ったときも true にする */
    const [isTouch, setIsTouch] = useState(false);
    const [stageWidth, setStageWidth] = useState(0);
    /** 動かせるようになったか（E2E テストが、ハイドレーションの前に操作しないための目印） */
    const [ready, setReady] = useState(false);

    const byId = new Map(parts.map((p) => [p.id, p]));

    const measure = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const base = stage.getBoundingClientRect();
        setStageWidth(base.width);
        const toBox = (el: Element): Box => {
            const r = el.getBoundingClientRect();
            return { top: r.top - base.top, left: r.left - base.left, width: r.width, height: r.height };
        };
        const targets: HTMLElement[] = hovered
            ? [hovered]
            : selectedId
              ? Array.from(stage.querySelectorAll<HTMLElement>(`[data-part="${CSS.escape(selectedId)}"]`))
              : [];
        // タブで絞り込まれて隠れているもの（大きさが無いもの）は囲まない
        const shown = targets.filter((el) => el.getClientRects().length > 0);
        setBoxes(shown.map((el) => ({ id: el.dataset.part ?? "", box: toBox(el) })));
    }, [hovered, selectedId]);

    useLayoutEffect(measure, [measure]);

    // 名前を見るモードでは見本の中身を inert にして、クリック・キーボード・タッチ・フォーカスのどれでも部品が動かないようにする。
    // React 18 は inert を属性として持たないので、直接付け外しする
    useLayoutEffect(() => {
        contentRef.current?.toggleAttribute("inert", mode === "parts");
    }, [mode]);

    // ?view=parts・?part= で開いたときは、画面に出す前に名前を見るモードにする（下の effect の読み直しを待つあいだに、部品を押せないように）。
    // サーバーで描くときは URL のクエリが分からないので、初めの値は "page" のままにして、ここで切り替える
    useLayoutEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const id = query.get("part");
        const hasPart = !!id && !!stageRef.current?.querySelector(`[data-part="${CSS.escape(id)}"]`);
        if (query.get("view") === "parts" || hasPart) {
            contentRef.current?.setAttribute("inert", "");
            setMode("parts");
        }
    }, []);

    // 見本の大きさが変わったら測り直す（窓の大きさのほか、フォントの読み込みやスクロールバーの出入りでも変わる）
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const observer = new ResizeObserver(measure);
        observer.observe(stage);
        return () => observer.disconnect();
    }, [measure]);

    useEffect(() => {
        setIsTouch(window.matchMedia("(hover: none)").matches);
        setReady(true);

        // 図鑑から来たとき：そのパーツを囲み、最初の1つが見えるところまで動かす。
        // 別のページから移ってきたときは、この effect のあとに URL が書き換わることがあるので、少し待ってから読む。
        // 同じページのまま戻る・進むで ?part= が変わったとき（popstate）も読み直し、無ければ囲みを外す。
        // 見方は ?view=parts で残す（図鑑へ移って戻ってきたときも、名前を見るモードのままにするため）。
        // useSearchParams を使うと、静的に作るこのページで見本ごとサーバーで描かれなくなるため、URL を直接読む
        let timer = 0;
        const syncFromQuery = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                const query = new URLSearchParams(window.location.search);
                const id = query.get("part");
                const first = id ? stageRef.current?.querySelector<HTMLElement>(`[data-part="${CSS.escape(id)}"]`) : null;
                setPinnedId(id && first ? id : null);
                setMode(first || query.get("view") === "parts" ? "parts" : "page");
                if (first) {
                    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                    first.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
                }
            }, 0);
        };
        syncFromQuery();
        window.addEventListener("popstate", syncFromQuery);

        // 一覧に無いパーツがページにあると、押しても図鑑に何も出ない。作る途中で気づけるように知らせる
        if (process.env.NODE_ENV !== "production" && stageRef.current) {
            const onPage = new Set(Array.from(stageRef.current.querySelectorAll<HTMLElement>("[data-part]")).map((el) => el.dataset.part));
            const listed = new Set(parts.map((p) => p.id));
            const missing = Array.from(onPage).filter((p) => p && !listed.has(p));
            const unused = Array.from(listed).filter((p) => !onPage.has(p));
            if (missing.length || unused.length) {
                console.warn("[catalog] samples とページのパーツが一致しません", { missing, unused });
            }
        }
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("popstate", syncFromQuery);
        };
    }, [parts]);

    /**
     * 画面の点にあるパーツ。入れ子のときは内側のもの。
     * 名前を見るモードでは中身が inert でイベントの target にならないので、要素の位置から探す
     */
    const partAt = (x: number, y: number) => {
        const stage = stageRef.current;
        if (!stage) return null;
        // 文書の順で後ろにあるものほど内側なので、最後に当たったものを使う
        let found: HTMLElement | null = null;
        stage.querySelectorAll<HTMLElement>("[data-part]").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && x >= r.left && x < r.right && y >= r.top && y < r.bottom) found = el;
        });
        return found as HTMLElement | null;
    };

    const changeMode = (next: Mode) => {
        setHovered(null);
        setMode(next);
        // 見方を URL に残す。ページを操作するモードに戻したら、図鑑から来たときの ?part= の囲みも外す
        const url = new URL(window.location.href);
        if (next === "parts") {
            url.searchParams.set("view", "parts");
        } else {
            url.searchParams.delete("view");
            url.searchParams.delete("part");
            setPinnedId(null);
        }
        window.history.replaceState(window.history.state, "", url);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        pointerType.current = e.pointerType;
        if (mode !== "parts" || e.pointerType === "touch") return;
        const el = partAt(e.clientX, e.clientY);
        if (el !== hovered) setHovered(el);
    };

    const onClick = (e: React.MouseEvent) => {
        if (mode !== "parts") return;
        const el = partAt(e.clientX, e.clientY);
        if (!el) return;
        const part = byId.get(el.dataset.part ?? "");
        if (!part) return;
        // タッチは指しただけの状態が無いので、1回目は名前を出すだけにする
        if (pointerType.current === "touch" && hovered !== el) {
            setPinnedId(null);
            setListId(null);
            setHovered(el);
            return;
        }
        router.push(part.href);
    };

    const active = boxes.length > 0 ? byId.get(boxes[0].id) : null;

    // 列の幅を中身（流れ続けるティッカーなど）で広げないよう、スマホでも minmax(0,1fr) にする
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <div>
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div role="group" aria-label={texts.modeLabel} className="flex rounded-full border border-white/15 p-0.5 text-xs">
                        {(
                            [
                                ["page", texts.modePage],
                                ["parts", texts.modeParts],
                            ] as const
                        ).map(([m, label]) => (
                            <button
                                key={m}
                                type="button"
                                aria-pressed={mode === m}
                                onClick={() => changeMode(m)}
                                className={`rounded-full px-3 py-1.5 transition-colors ${
                                    mode === m ? "bg-cyan-200/15 text-cyan-200" : "text-white/60 hover:text-white"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400">{mode === "page" ? texts.hintPage : isTouch ? texts.hintTouch : texts.hintPointer}</p>
                </div>

                {/* ブラウザの枠 */}
                <div className="overflow-hidden rounded-xl border border-white/15 bg-black/40 shadow-[0_0_40px_rgba(120,255,255,0.06)]">
                    <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
                        <span className="flex gap-1.5" aria-hidden>
                            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                        </span>
                        <span className="flex-1 truncate rounded-md bg-black/30 px-3 py-1 text-center text-[11px] text-white/50">
                            {domain}
                        </span>
                    </div>

                    <div
                        ref={stageRef}
                        data-testid="catalog-stage"
                        data-ready={ready ? "" : undefined}
                        data-mode={mode}
                        data-catalog-page=""
                        // 名前を見るモードでは中身を押せないので、1枚の絵として読み上げる
                        role={mode === "parts" ? "img" : "region"}
                        aria-label={texts.previewLabel}
                        className={`relative ${mode === "parts" ? "cursor-pointer" : ""}`}
                        onPointerMove={onPointerMove}
                        onPointerDown={(e) => {
                            pointerType.current = e.pointerType;
                            if (e.pointerType === "touch") setIsTouch(true);
                        }}
                        onPointerLeave={() => pointerType.current !== "touch" && setHovered(null)}
                        onClick={onClick}
                    >
                        <div ref={contentRef}>{children}</div>

                        {boxes.map(({ id, box }, i) => (
                            <div
                                key={`${id}-${i}`}
                                aria-hidden
                                data-testid="catalog-part-box"
                                className="pointer-events-none absolute rounded-[3px] outline outline-2 outline-offset-[-2px] outline-cyan-300 transition-all duration-150 motion-reduce:transition-none"
                                style={box}
                            />
                        ))}

                        {active && boxes[0] && (
                            <div
                                aria-hidden
                                data-testid="catalog-part-label"
                                className="pointer-events-none absolute z-10 flex max-w-[calc(100%-8px)] items-center gap-2 overflow-hidden whitespace-nowrap rounded-md bg-cyan-300 px-2.5 py-1 text-[11px] font-medium text-slate-950 shadow-lg"
                                style={{
                                    // 右半分にあるパーツは右端に揃えて、名前が枠の外で切れないようにする
                                    ...(boxes[0].box.left + boxes[0].box.width / 2 > stageWidth / 2
                                        ? { right: Math.max(stageWidth - boxes[0].box.left - boxes[0].box.width, 4) }
                                        : { left: Math.max(boxes[0].box.left, 4) }),
                                    // 上に余白が無いときは枠の内側に出す
                                    top: boxes[0].box.top >= 30 ? boxes[0].box.top - 30 : boxes[0].box.top + 6,
                                }}
                            >
                                {active.name}
                                {active.sub && <span className="text-slate-700">{active.sub}</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* タッチで名前を出したあとの、図鑑へのボタン（2回目のタップの代わりにも押せる） */}
                {mode === "parts" && isTouch && hovered && byId.get(hovered.dataset.part ?? "") && (
                    <div className="sticky bottom-4 mt-3 flex justify-center">
                        <Link
                            href={byId.get(hovered.dataset.part ?? "")!.href}
                            className="rounded-full border border-cyan-200/50 bg-black/80 px-5 py-2.5 text-xs tracking-wider text-cyan-200 backdrop-blur"
                        >
                            {byId.get(hovered.dataset.part ?? "")!.name} — {texts.openInParts} →
                        </Link>
                    </div>
                )}
            </div>

            <nav aria-label={texts.partsOnPage} className="lg:sticky lg:top-20 lg:self-start">
                <p className="mb-3 text-xs tracking-[0.2em] text-cyan-100/60">{texts.partsOnPage}</p>
                <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
                    {parts.map((p) => (
                        <li key={p.id}>
                            <Link
                                href={p.href}
                                onMouseEnter={() => {
                                    setHovered(null);
                                    setListId(p.id);
                                }}
                                onMouseLeave={() => setListId(null)}
                                onFocus={() => {
                                    setHovered(null);
                                    setListId(p.id);
                                }}
                                onBlur={() => setListId(null)}
                                className={`block rounded-full border px-3 py-1.5 text-xs transition-colors lg:rounded-lg lg:border-transparent ${
                                    selectedId === p.id
                                        ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-200"
                                        : "border-white/15 text-white/70 hover:text-white"
                                }`}
                            >
                                {p.name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};
