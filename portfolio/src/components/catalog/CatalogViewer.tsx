// src/components/catalog/CatalogViewer.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CATALOG_WIDTHS, CATALOG_WIDTH_PX, CatalogWidth, isCatalogWidth } from "@/lib/catalog/widths";

type PartLabel = { id: string; name: string; sub: string; href: string };

type Box = { top: number; left: number; width: number; height: number };

type Mode = "page" | "parts";

/** これより狭い画面（スマホ）では幅の切り替えを出さず、いつも枠の幅で描く */
const NARROW_QUERY = "(max-width: 639px)";

/** iframe の中身の高さが分かるまでの仮の高さ */
const FRAME_PLACEHOLDER_HEIGHT = 600;

/**
 * デザインカタログの見本のページを、ブラウザの枠に入れて表示する。見方は2つあり、枠の上のボタンで切り替える。
 *
 * 見本は、見本だけのページ（frameSrc、/catalog-frame/<見本>）を iframe に入れて描く。
 * 幅（src/lib/catalog/widths.ts）を選ぶと、その幅の iframe にする。見本の中は画面の幅（sm: など）で並びが変わる書き方なので、
 * iframe にすると本物の画面と同じように並び替わる。既定の「画面に合わせる」では枠の幅の iframe にする。
 * どの幅でも同じ iframe のまま大きさだけを変えるので、見本の中で選んだタブや入力した文字は、幅を変えても残る。
 * - 枠より広い幅は、縮めて全体を見せる。スマホの画面では幅の切り替えを出さず、枠の幅で描く
 * - iframe の高さは中身に合わせ、iframe の中ではスクロールさせない（ページごとスクロールする）
 * - 選んだ幅は URL に ?width= で残す
 *
 * ページを操作するモード（既定）
 * - 見本の中のボタン・タブ・アコーディオン・フォームが、ページの中で動く（Interactive.tsx）。図鑑へは移らない
 *
 * パーツの名前を見るモード
 * - パーツ（data-part の付いた要素）を指すと、枠と名前を出す
 * - クリックするとパーツ図鑑のその項目へ移る。タッチでは1回目のタップで名前を出し、同じパーツをもう一度タップで移る。
 *   見本の部品が動かないよう iframe を inert にし、指す・押すは iframe を素通りさせて（pointer-events: none）この枠で受ける。
 *   同じサイトの iframe なので中を直接読み、パーツの位置を縮めた割合で枠の上の位置に直して探す
 * - ?part=<id> 付きで開くと、このモードになり、そのパーツを囲んで見える位置までスクロールする（図鑑の「ページで見る」から来たとき）
 * - このモードのあいだは URL に ?view=parts を付け、図鑑へ移って戻ってきても、このモードのままにする
 *
 * どちらのモードでも、横の一覧を指すと、そのパーツをページの中で全部囲む（キーボードではフォーカスで同じことが起きる）。
 * 一覧から外れると ?part= の囲みに戻る
 */
export const CatalogViewer = ({
    domain,
    parts,
    frameSrc,
    texts,
}: {
    domain: string;
    parts: PartLabel[];
    /** 見本だけのページの URL（表示中の言語のもの） */
    frameSrc: string;
    texts: {
        previewLabel: string;
        /** iframe の名前。{width} に幅の名前を差し込む */
        frameTitle: string;
        modeLabel: string;
        modePage: string;
        modeParts: string;
        hintPage: string;
        hintPointer: string;
        hintTouch: string;
        partsOnPage: string;
        openInParts: string;
        widthLabel: string;
        widths: Record<CatalogWidth, string>;
        /** {px}・{percent} を差し込む（縮めて見せているとき） */
        widthScaled: string;
    };
}) => {
    const router = useRouter();
    const stageRef = useRef<HTMLDivElement>(null);
    const frameRef = useRef<HTMLIFrameElement>(null);
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

    const [width, setWidth] = useState<CatalogWidth>("fit");
    /** スマホの画面か。そのときは幅を選んでいても、枠の幅で描く */
    const [narrow, setNarrow] = useState(false);
    const shownWidth: CatalogWidth = narrow ? "fit" : width;
    /** iframe の中が読めるようになったか */
    const [frameLoaded, setFrameLoaded] = useState(false);
    /** iframe の中の見本の高さ。読み込む前は仮の高さ。幅を変えても、測り直すまでは前の高さのままにする */
    const [frameHeight, setFrameHeight] = useState(FRAME_PLACEHOLDER_HEIGHT);
    /** iframe の幅（px）。画面に合わせるときは枠の幅（測る前は null で、枠いっぱいにする） */
    const framePx = CATALOG_WIDTH_PX[shownWidth] ?? (stageWidth > 0 ? stageWidth : null);
    // 枠より広い幅は、枠に収まるまで縮める（狭い幅は等倍のまま真ん中に置く）
    const scale = framePx && stageWidth > 0 ? Math.min(1, stageWidth / framePx) : 1;

    const byId = new Map(parts.map((p) => [p.id, p]));

    /** パーツを探す範囲（iframe の中の見本）。読み込む前は null */
    const pageRoot = useCallback(
        (): HTMLElement | null => frameRef.current?.contentDocument?.querySelector<HTMLElement>("[data-catalog-page]") ?? null,
        []
    );

    /** iframe の中の要素の位置を、枠（stage）の左上から測った位置にする。縮めた割合を掛けて直す */
    const boxOf = useCallback(
        (el: Element): Box => {
            const base = stageRef.current!.getBoundingClientRect();
            const frame = frameRef.current!.getBoundingClientRect();
            const r = el.getBoundingClientRect();
            return {
                top: frame.top - base.top + r.top * scale,
                left: frame.left - base.left + r.left * scale,
                width: r.width * scale,
                height: r.height * scale,
            };
        },
        [scale]
    );

    const measure = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return;
        setStageWidth(stage.getBoundingClientRect().width);
        const root = pageRoot();
        const targets: HTMLElement[] = hovered
            ? [hovered]
            : selectedId && root
              ? Array.from(root.querySelectorAll<HTMLElement>(`[data-part="${CSS.escape(selectedId)}"]`))
              : [];
        // タブで絞り込まれて隠れているもの（大きさが無いもの）や、描き直されて無くなったものは囲まない
        const shown = targets.filter((el) => el.isConnected && el.getClientRects().length > 0);
        setBoxes(shown.map((el) => ({ id: el.dataset.part ?? "", box: boxOf(el) })));
    }, [hovered, selectedId, pageRoot, boxOf]);

    useLayoutEffect(measure, [measure, frameHeight, framePx, frameLoaded]);

    // 名前を見るモードでは iframe を inert にして、クリック・キーボード・タッチ・フォーカスのどれでも見本の部品が動かないようにする。
    // React 18 は inert を属性として持たないので、直接付け外しする。iframe はサーバーから inert で届き、ページを操作するモードならここで外す
    // （ハイドレーションの前に、名前を見るモードの見本を押せないように）
    useLayoutEffect(() => {
        frameRef.current?.toggleAttribute("inert", mode === "parts");
    }, [mode]);

    // ?view=parts・?part= で開いたときは、画面に出す前に名前を見るモードにする（下の effect の読み直しを待つあいだに、部品を押せないように）。
    // サーバーで描くときは URL のクエリが分からないので、初めの値は "page" のままにして、ここで切り替える。
    // ?width= もここで読み、画面に出す前にその幅にする
    useLayoutEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const id = query.get("part");
        if (query.get("view") === "parts" || (!!id && byId.has(id))) {
            frameRef.current?.setAttribute("inert", "");
            setMode("parts");
        }
        const w = query.get("width");
        if (isCatalogWidth(w)) setWidth(w);
        const narrowQuery = window.matchMedia(NARROW_QUERY);
        setNarrow(narrowQuery.matches);
        const onChange = () => setNarrow(narrowQuery.matches);
        narrowQuery.addEventListener("change", onChange);
        return () => narrowQuery.removeEventListener("change", onChange);
        // 開いたときに一度だけ読む
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 枠の大きさが変わったら測り直す（窓の大きさのほか、スクロールバーの出入りでも変わる）
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const observer = new ResizeObserver(measure);
        observer.observe(stage);
        return () => observer.disconnect();
    }, [measure]);

    /** そのパーツの最初の1つ（見えているもの）を、見える位置まで動かす。見つからなければ false */
    const scrollToPart = useCallback(
        (id: string) => {
            const el = Array.from(pageRoot()?.querySelectorAll<HTMLElement>(`[data-part="${CSS.escape(id)}"]`) ?? []).find(
                (candidate) => candidate.getClientRects().length > 0
            );
            if (!el) return false;
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            // iframe の中の要素でも、親のページごとスクロールして見える位置に出す
            el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
            return true;
        },
        [pageRoot]
    );

    /**
     * ?part= のパーツへの、まだ済んでいないスクロール。開いたときと、戻る・進むで ?part= が変わったときだけ予約し、
     * iframe が読み込まれて中身の高さになってから動かす（幅を変えただけでは動かさない）
     */
    const pendingScroll = useRef<string | null>(null);
    const flushScroll = useCallback(() => {
        const id = pendingScroll.current;
        if (!id || !frameLoaded) return;
        // 見つからないとき（まだ描かれていないとき）は、予約を残して次の機会に回す
        if (scrollToPart(id)) pendingScroll.current = null;
    }, [frameLoaded, scrollToPart]);
    useEffect(flushScroll, [flushScroll, frameHeight]);
    /** 開いたときにだけ作る関数（syncFromQuery）から、今の値を読むためのもの */
    const latest = useRef({ flushScroll, byId });
    latest.current = { flushScroll, byId };

    useEffect(() => {
        setIsTouch(window.matchMedia("(hover: none)").matches);
        setReady(true);

        // 図鑑から来たとき：そのパーツを囲み、最初の1つが見えるところまで動かす。
        // 別のページから移ってきたときは、この effect のあとに URL が書き換わることがあるので、少し待ってから読む。
        // 同じページのまま戻る・進むで ?part= が変わったとき（popstate）も読み直し、無ければ囲みを外す。
        // 見方は ?view=parts、幅は ?width= で残す（図鑑へ移って戻ってきたときも、同じ見方・幅のままにするため）。
        // useSearchParams を使うと、静的に作るこのページがサーバーで描かれなくなるため、URL を直接読む
        let timer = 0;
        const syncFromQuery = () => {
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                const query = new URLSearchParams(window.location.search);
                const id = query.get("part");
                const exists = !!id && latest.current.byId.has(id);
                setPinnedId(exists ? id : null);
                setMode(exists || query.get("view") === "parts" ? "parts" : "page");
                const w = query.get("width");
                setWidth(isCatalogWidth(w) ? w : "fit");
                pendingScroll.current = exists ? id : null;
                // 幅が変わったときは描き直されてから動かす（高さが変われば上の effect でも動かす）
                window.requestAnimationFrame(() => latest.current.flushScroll());
            }, 0);
        };
        syncFromQuery();
        window.addEventListener("popstate", syncFromQuery);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener("popstate", syncFromQuery);
        };
    }, []);

    // iframe の中の見本の高さを追いかけ、iframe をその高さにする（タブで絞り込む・アコーディオンを開く・幅を変えるなどで変わる）。
    // ResizeObserver は iframe の中の window のものを使う。
    // 見本の要素は、iframe の中で React が描き直すと別のものに替わることがあるので、
    // 中の要素の出入りを MutationObserver で見て、替わったら測る相手を付け替える
    const frameObservers = useRef<{ disconnect: () => void }[]>([]);
    const onFrameLoad = () => {
        frameObservers.current.forEach((o) => o.disconnect());
        frameObservers.current = [];
        const win = frameRef.current?.contentWindow as (Window & typeof globalThis) | null;
        const doc = frameRef.current?.contentDocument;
        if (!win || !doc?.body) return;
        let observed: HTMLElement | null = null;
        const resize = new win.ResizeObserver(() => {
            if (observed) setFrameHeight(Math.ceil(observed.getBoundingClientRect().height));
        });
        const attach = () => {
            const root = doc.querySelector<HTMLElement>("[data-catalog-page]");
            if (!root || root === observed) return;
            if (observed) resize.unobserve(observed);
            resize.observe(root);
            observed = root;
            setFrameHeight(Math.ceil(root.getBoundingClientRect().height));
        };
        const mutation = new win.MutationObserver(attach);
        mutation.observe(doc.body, { childList: true, subtree: true });
        frameObservers.current = [resize, mutation];
        attach();
        setFrameLoaded(true);

        // 一覧に無いパーツがページにあると、押しても図鑑に何も出ない。作る途中で気づけるように知らせる
        if (process.env.NODE_ENV !== "production" && observed) {
            const onPage = new Set(Array.from((observed as HTMLElement).querySelectorAll<HTMLElement>("[data-part]")).map((el) => el.dataset.part));
            const listed = new Set(parts.map((p) => p.id));
            const missing = Array.from(onPage).filter((p) => p && !listed.has(p));
            const unused = Array.from(listed).filter((p) => !onPage.has(p));
            if (missing.length || unused.length) {
                console.warn("[catalog] samples とページのパーツが一致しません", { missing, unused });
            }
        }
    };
    useEffect(() => () => frameObservers.current.forEach((o) => o.disconnect()), []);

    // iframe が、こちらの描画より先に読み込みを終えていたとき（キャッシュから読んだときなど）は、onLoad が来ないので自分で始める
    useEffect(() => {
        if (frameRef.current?.contentDocument?.readyState === "complete" && pageRoot()) onFrameLoad();
        // 開いたときに一度だけ確かめる
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 幅を変えたら、指していた要素は別の場所に移るので外す
    useEffect(() => setHovered(null), [shownWidth]);

    /**
     * 画面の点にあるパーツ。入れ子のときは内側のもの。
     * 名前を見るモードでは iframe が inert でイベントの target にならないので、要素の位置から探す。
     * 点を iframe の中の位置（縮める前）に直してから探す
     */
    const partAt = (x: number, y: number) => {
        const root = pageRoot();
        const frame = frameRef.current?.getBoundingClientRect();
        if (!root || !frame) return null;
        const px = (x - frame.left) / scale;
        const py = (y - frame.top) / scale;
        // 文書の順で後ろにあるものほど内側なので、最後に当たったものを使う
        let found: HTMLElement | null = null;
        root.querySelectorAll<HTMLElement>("[data-part]").forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.height > 0 && px >= r.left && px < r.right && py >= r.top && py < r.bottom) found = el;
        });
        return found as HTMLElement | null;
    };

    /** 見方・幅を URL に残す（replaceState なので、戻るの履歴は増やさない） */
    const replaceQuery = (update: (params: URLSearchParams) => void) => {
        const url = new URL(window.location.href);
        update(url.searchParams);
        window.history.replaceState(window.history.state, "", url);
    };

    const changeMode = (next: Mode) => {
        setHovered(null);
        setMode(next);
        // ページを操作するモードに戻したら、図鑑から来たときの ?part= の囲みも外す
        replaceQuery((params) => {
            if (next === "parts") {
                params.set("view", "parts");
            } else {
                params.delete("view");
                params.delete("part");
            }
        });
        if (next === "page") setPinnedId(null);
    };

    const changeWidth = (next: CatalogWidth) => {
        setHovered(null);
        setWidth(next);
        replaceQuery((params) => (next === "fit" ? params.delete("width") : params.set("width", next)));
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
    const fixedPx = CATALOG_WIDTH_PX[shownWidth];

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
                    {/* スマホの画面では、小さくなりすぎるので出さない */}
                    <div role="group" aria-label={texts.widthLabel} className="hidden rounded-full border border-white/15 p-0.5 text-xs sm:flex">
                        {CATALOG_WIDTHS.map((w) => (
                            <button
                                key={w}
                                type="button"
                                aria-pressed={width === w}
                                onClick={() => changeWidth(w)}
                                className={`rounded-full px-3 py-1.5 transition-colors ${
                                    width === w ? "bg-cyan-200/15 text-cyan-200" : "text-white/60 hover:text-white"
                                }`}
                            >
                                {texts.widths[w]}
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
                        {fixedPx !== null && (
                            <span data-testid="catalog-width-info" className="shrink-0 text-[10px] tracking-wider text-white/40">
                                {scale < 1
                                    ? texts.widthScaled.replace("{px}", String(fixedPx)).replace("{percent}", String(Math.round(scale * 100)))
                                    : `${fixedPx}px`}
                            </span>
                        )}
                    </div>

                    <div
                        ref={stageRef}
                        data-testid="catalog-stage"
                        data-ready={ready ? "" : undefined}
                        data-frame-ready={frameLoaded ? "" : undefined}
                        data-mode={mode}
                        data-width={shownWidth}
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
                        <div
                            className="relative mx-auto overflow-hidden"
                            style={{
                                width: framePx ? framePx * scale : "100%",
                                height: frameHeight * scale,
                            }}
                        >
                            <iframe
                                ref={frameRef}
                                src={frameSrc}
                                title={texts.frameTitle.replace("{width}", texts.widths[shownWidth])}
                                onLoad={onFrameLoad}
                                // 中身の高さに合わせるので、iframe の中ではスクロールさせない
                                scrolling="no"
                                // 名前を見るモードでは、キーボードでも iframe に入らない
                                tabIndex={mode === "parts" ? -1 : undefined}
                                className="absolute left-0 top-0 block origin-top-left border-0"
                                style={{
                                    width: framePx ?? "100%",
                                    height: frameHeight,
                                    transform: scale < 1 ? `scale(${scale})` : undefined,
                                    // 名前を見るモードでは、指す・押すを iframe の外（この枠）で受ける
                                    pointerEvents: mode === "parts" ? "none" : undefined,
                                }}
                                // サーバーで描くときは見方が分からないので、inert で出しておき、動かせるようになってから外す
                                // （React 18 は inert を属性として扱わないので、空の文字列で渡す）
                                {...({ inert: "" } as object)}
                            />
                        </div>

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
