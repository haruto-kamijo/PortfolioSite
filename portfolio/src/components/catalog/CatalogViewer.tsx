// src/components/catalog/CatalogViewer.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type PartLabel = { id: string; name: string; sub: string; href: string };

type Box = { top: number; left: number; width: number; height: number };

/**
 * デザインカタログの見本のページを、ブラウザの枠に入れて表示する。
 *
 * - パーツ（data-part の付いた要素）を指すと、枠と名前を出す
 * - クリックするとパーツ図鑑のその項目へ移る。タッチでは1回目のタップで名前を出し、同じパーツをもう一度タップで移る
 * - 横の一覧を指すと、そのパーツをページの中で全部囲む（キーボードではフォーカスで同じことが起きる）
 * - ?part=<id> 付きで開くと、そのパーツを囲んで見える位置までスクロールする（図鑑の「ページで見る」から来たとき）
 *
 * 見本の中身はサーバーで描いた children で、押せる要素は持たない。ここではクリックを横取りするだけ
 */
export const CatalogViewer = ({
    domain,
    parts,
    texts,
    children,
}: {
    domain: string;
    parts: PartLabel[];
    texts: { previewLabel: string; hintPointer: string; hintTouch: string; partsOnPage: string; openInParts: string };
    children: React.ReactNode;
}) => {
    const router = useRouter();
    const stageRef = useRef<HTMLDivElement>(null);
    const pointerType = useRef<string>("mouse");

    /** 指している1つの要素 */
    const [hovered, setHovered] = useState<HTMLElement | null>(null);
    /** 一覧やクエリで選んだパーツ（ページの中の同じパーツを全部囲む） */
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [boxes, setBoxes] = useState<{ id: string; box: Box }[]>([]);
    const [isTouch, setIsTouch] = useState(false);

    const byId = new Map(parts.map((p) => [p.id, p]));

    const measure = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const base = stage.getBoundingClientRect();
        const toBox = (el: Element): Box => {
            const r = el.getBoundingClientRect();
            return { top: r.top - base.top, left: r.left - base.left, width: r.width, height: r.height };
        };
        const targets: HTMLElement[] = hovered
            ? [hovered]
            : selectedId
              ? Array.from(stage.querySelectorAll<HTMLElement>(`[data-part="${selectedId}"]`))
              : [];
        setBoxes(targets.map((el) => ({ id: el.dataset.part ?? "", box: toBox(el) })));
    }, [hovered, selectedId]);

    useLayoutEffect(measure, [measure]);

    useEffect(() => {
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    useEffect(() => {
        setIsTouch(window.matchMedia("(hover: none)").matches);

        // 図鑑から来たとき：そのパーツを囲み、最初の1つが見えるところまで動かす。
        // 別のページから移ってきたときは、この effect のあとに URL が書き換わることがあるので、少し待ってから読む
        const timer = window.setTimeout(() => {
            const id = new URLSearchParams(window.location.search).get("part");
            const first = id ? stageRef.current?.querySelector<HTMLElement>(`[data-part="${CSS.escape(id)}"]`) : null;
            if (id && first) {
                setSelectedId(id);
                first.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        }, 0);

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
        return () => window.clearTimeout(timer);
    }, [parts]);

    const partAt = (target: EventTarget | null) => {
        const stage = stageRef.current;
        const el = target instanceof Element ? target.closest<HTMLElement>("[data-part]") : null;
        return el && stage?.contains(el) ? el : null;
    };

    const onPointerMove = (e: React.PointerEvent) => {
        pointerType.current = e.pointerType;
        if (e.pointerType === "touch") return;
        const el = partAt(e.target);
        if (el !== hovered) setHovered(el);
    };

    const onClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const el = partAt(e.target);
        if (!el) return;
        const part = byId.get(el.dataset.part ?? "");
        if (!part) return;
        // タッチは指しただけの状態が無いので、1回目は名前を出すだけにする
        if (pointerType.current === "touch" && hovered !== el) {
            setSelectedId(null);
            setHovered(el);
            return;
        }
        router.push(part.href);
    };

    const active = boxes.length > 0 ? byId.get(boxes[0].id) : null;

    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <div>
                <p className="mb-3 text-xs text-slate-400">{isTouch ? texts.hintTouch : texts.hintPointer}</p>

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
                        role="img"
                        aria-label={texts.previewLabel}
                        className="relative cursor-pointer"
                        onPointerMove={onPointerMove}
                        onPointerDown={(e) => (pointerType.current = e.pointerType)}
                        onPointerLeave={() => pointerType.current !== "touch" && setHovered(null)}
                        onClick={onClick}
                    >
                        {children}

                        {boxes.map(({ id, box }, i) => (
                            <div
                                key={`${id}-${i}`}
                                aria-hidden
                                className="pointer-events-none absolute rounded-[3px] outline outline-2 outline-offset-2 outline-cyan-300 transition-all duration-150"
                                style={box}
                            />
                        ))}

                        {active && boxes[0] && (
                            <div
                                aria-hidden
                                className="pointer-events-none absolute z-10 flex items-center gap-2 whitespace-nowrap rounded-md bg-cyan-300 px-2.5 py-1 text-[11px] font-medium text-slate-950 shadow-lg"
                                style={{
                                    left: Math.max(boxes[0].box.left, 4),
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
                {isTouch && hovered && byId.get(hovered.dataset.part ?? "") && (
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
                                    setSelectedId(p.id);
                                }}
                                onMouseLeave={() => setSelectedId(null)}
                                onFocus={() => {
                                    setHovered(null);
                                    setSelectedId(p.id);
                                }}
                                onBlur={() => setSelectedId(null)}
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
