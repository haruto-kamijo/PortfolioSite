"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SpaceCanvas = dynamic(() => import("../components/three/SpaceCanvas"), {
    ssr: false,
});

type Phase = "idle" | "spinup" | "flash" | "warp";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type DotConfig = {
    baseDurSec: number;
    minDurSec: number;
    dir: 1 | -1;
    startDeg: number;
};

function randBetween(min: number, max: number) {
    return min + Math.random() * (max - min);
}
function randSign(): 1 | -1 {
    return Math.random() < 0.5 ? 1 : -1;
}

function RingLayer({
                       sizeCss,
                       borderClass,
                       ringRef,
                       dotARef,
                       dotBRef,
                       tailARef,
                       tailBRef,
                       dotSize,
                   }: {
    sizeCss: string;
    borderClass: string;
    ringRef: (el: HTMLDivElement | null) => void;

    dotARef: (el: HTMLDivElement | null) => void;
    dotBRef: (el: HTMLDivElement | null) => void;

    tailARef: (el: SVGCircleElement | null) => void;
    tailBRef: (el: SVGCircleElement | null) => void;

    dotSize: number;
}) {
    const R = 49.2;
    const baseRotate = "rotate(-90deg)";

    return (
        <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: sizeCss, height: sizeCss }}
        >
            <div
                ref={ringRef}
                className={`absolute inset-0 rounded-full border ${borderClass}`}
                style={{ borderWidth: 1 }}
            />

            {/* Dot A */}
            <div ref={dotARef} className="absolute inset-0">
                {/* ✅ drop-shadowが四角く見えるのを避けるため余白viewBox+overflow visible */}
                <svg
                    className="absolute inset-0"
                    viewBox="-12 -12 124 124"
                    style={{ overflow: "visible" }}
                >
                    <circle
                        ref={tailARef}
                        cx="50"
                        cy="50"
                        r={R}
                        pathLength={1000}
                        fill="none"
                        stroke="rgba(255,255,255,0.9)"
                        style={{
                            opacity: 0,
                            strokeWidth: 0,
                            strokeDasharray: "0 9999",
                            strokeLinecap: "round",
                            filter: "drop-shadow(0 0 10px rgba(120,255,255,0.25))",
                            transform: baseRotate,
                            transformOrigin: "50% 50%",
                        }}
                    />
                </svg>

                <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -(dotSize / 2) }}>
                    <div
                        className="rounded-full bg-white"
                        style={{
                            width: dotSize,
                            height: dotSize,
                            boxShadow: "0 0 26px rgba(255,255,255,0.9), 0 0 80px rgba(120,255,255,0.20)",
                        }}
                    />
                </div>
            </div>

            {/* Dot B */}
            <div ref={dotBRef} className="absolute inset-0">
                <svg
                    className="absolute inset-0"
                    viewBox="-12 -12 124 124"
                    style={{ overflow: "visible" }}
                >
                    <circle
                        ref={tailBRef}
                        cx="50"
                        cy="50"
                        r={R}
                        pathLength={1000}
                        fill="none"
                        stroke="rgba(255,255,255,0.9)"
                        style={{
                            opacity: 0,
                            strokeWidth: 0,
                            strokeDasharray: "0 9999",
                            strokeLinecap: "round",
                            filter: "drop-shadow(0 0 10px rgba(120,255,255,0.25))",
                            transform: `${baseRotate} rotate(180deg)`,
                            transformOrigin: "50% 50%",
                        }}
                    />
                </svg>

                <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -(dotSize / 2) }}>
                    <div
                        className="rounded-full bg-white"
                        style={{
                            width: dotSize,
                            height: dotSize,
                            boxShadow: "0 0 26px rgba(255,255,255,0.9), 0 0 80px rgba(120,255,255,0.20)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

function ContentRings({ phase, spinUpMs = 5000 }: { phase: Phase; spinUpMs?: number }) {
    const ringEls = useRef<Array<HTMLDivElement | null>>([null, null, null]);
    const dotEls = useRef<Array<HTMLDivElement | null>>(Array(6).fill(null));
    const tailEls = useRef<Array<SVGCircleElement | null>>(Array(6).fill(null));

    const spinRef = useRef({ active: false, startAt: 0 });

    // ✅ tailが満タンになった瞬間を検出
    const grewFullRef = useRef(false);

    // ✅ リングだけ強フラッシュ（120ms）
    const ringFlashUntilRef = useRef(0);

    // ✅ さらに「1フレームだけ太くする」用（約1〜2フレーム）
    const ringBumpUntilRef = useRef(0);

    const cfgRef = useRef<DotConfig[] | null>(null);
    if (!cfgRef.current) {
        const makeCfg = (baseMin: number, baseMax: number, minMin: number, minMax: number): DotConfig => ({
            baseDurSec: randBetween(baseMin, baseMax),
            minDurSec: randBetween(minMin, minMax),
            dir: randSign(),
            startDeg: randBetween(0, 360),
        });

        cfgRef.current = [
            makeCfg(7.0, 10.0, 0.9, 1.4),
            makeCfg(7.0, 10.0, 0.9, 1.4),
            makeCfg(5.5, 8.0, 0.75, 1.2),
            makeCfg(5.5, 8.0, 0.75, 1.2),
            makeCfg(4.5, 6.5, 0.65, 1.05),
            makeCfg(4.5, 6.5, 0.65, 1.05),
        ];
    }

    useEffect(() => {
        const id = "orbitVar-keyframes";
        if (document.getElementById(id)) return;
        const style = document.createElement("style");
        style.id = id;
        style.textContent = `
@keyframes orbitVar { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
        document.head.appendChild(style);
    }, []);

    useEffect(() => {
        if (phase === "spinup") {
            spinRef.current = { active: true, startAt: performance.now() };
            grewFullRef.current = false;
            ringFlashUntilRef.current = 0;
            ringBumpUntilRef.current = 0;
        }

        if (phase === "idle") {
            spinRef.current.active = false;
            grewFullRef.current = false;
            ringFlashUntilRef.current = 0;
            ringBumpUntilRef.current = 0;

            ringEls.current.forEach((el, i) => {
                if (!el) return;
                el.style.borderWidth = "1px";
                el.style.boxShadow =
                    i === 0
                        ? "0 0 16px rgba(255,255,255,0.32), 0 0 70px rgba(255,255,255,0.10)"
                        : i === 1
                            ? "0 0 14px rgba(255,255,255,0.28), 0 0 60px rgba(255,255,255,0.09)"
                            : "0 0 12px rgba(255,255,255,0.24), 0 0 52px rgba(255,255,255,0.08)";
            });

            cfgRef.current!.forEach((cfg, i) => {
                const el = dotEls.current[i];
                if (!el) return;
                el.style.animation = "none";
                el.style.transform = `rotate(${cfg.startDeg}deg)`;
                void el.offsetHeight;
                el.style.animation = `orbitVar ${cfg.baseDurSec}s linear infinite`;
                el.style.animationDirection = cfg.dir === 1 ? "normal" : "reverse";
            });

            tailEls.current.forEach((c) => {
                if (!c) return;
                c.style.opacity = "0";
                c.style.strokeWidth = "0";
                c.style.strokeDasharray = "0 9999";
                c.style.filter = "drop-shadow(0 0 10px rgba(120,255,255,0.25))";
            });
        }
    }, [phase]);

    useEffect(() => {
        let raf = 0;

        const tick = (now: number) => {
            if (phase !== "spinup" || !spinRef.current.active) {
                raf = requestAnimationFrame(tick);
                return;
            }

            const tRaw = (now - spinRef.current.startAt) / spinUpMs;
            const t = clamp01(tRaw);
            const k = easeInOutCubic(t);

            // tail: warpの2秒前に100%
            const growEnd = Math.max(0.001, (spinUpMs - 2000) / spinUpMs);
            const growT = clamp01(t / growEnd);
            const growK = easeInOutCubic(growT);

            const LEN = 1000;
            const arcLen = Math.floor(LEN * growK);
            const gapLen = LEN - arcLen;

            const isFull = growT >= 1;

            // ✅ 伸び切った瞬間にリングだけ強フラッシュ + 1フレーム太く
            if (isFull && !grewFullRef.current) {
                grewFullRef.current = true;
                ringFlashUntilRef.current = now + 120; // 光量フラッシュ
                ringBumpUntilRef.current = now + 34;   // 太さは約1〜2フレーム
            }

            const inFlash = now < ringFlashUntilRef.current;
            const inBump = now < ringBumpUntilRef.current;

            // rings baseline
            const outerBW = 1 + k * 4; // 1→5
            const glow = 0.10 + k * 0.30;

            ringEls.current.forEach((el, i) => {
                if (!el) return;

                // ✅ 1フレームだけ太さを上乗せ
                const bump = inBump ? 2.5 : 0; // 太さの上乗せ量（好みで）
                const bw = Math.max(1, outerBW - i + bump);

                // ✅ フラッシュ時にshadowを強化
                const baseA = 16 + k * 34;
                const baseB = 60 + k * 140;
                const flashMul = inFlash ? 2.2 : 1.0;
                const flashAlpha = inFlash ? 0.95 : 1.0;

                el.style.borderWidth = `${bw}px`;
                el.style.boxShadow = `
          0 0 ${baseA * flashMul}px rgba(120,255,255,${glow * flashAlpha}),
          0 0 ${baseB * flashMul}px rgba(120,255,255,${glow * 0.5 * flashAlpha})
        `;
            });

            // dot speeds (random per dot)
            cfgRef.current!.forEach((cfg, i) => {
                const el = dotEls.current[i];
                if (!el) return;
                const dur = cfg.baseDurSec + (cfg.minDurSec - cfg.baseDurSec) * k;
                el.style.animationDuration = `${dur}s`;
                el.style.animationDirection = cfg.dir === 1 ? "normal" : "reverse";
            });

            // tails
            const baseOpacity = 0.10 + 0.60 * growK;
            const strokeBase = 0.8 + 3.4 * growK;

            tailEls.current.forEach((c, idx) => {
                if (!c) return;
                const ringIdx = idx < 2 ? 0 : idx < 4 ? 1 : 2;
                const w = Math.max(0.9, strokeBase - ringIdx * 0.55);

                c.style.opacity = `${baseOpacity}`;
                c.style.strokeWidth = `${w}px`;
                c.style.strokeDasharray = `${arcLen} ${gapLen}`;

                if (isFull) {
                    c.style.opacity = "1";
                    c.style.filter =
                        "drop-shadow(0 0 16px rgba(120,255,255,0.60)) drop-shadow(0 0 40px rgba(120,255,255,0.30))";
                } else {
                    c.style.filter = "drop-shadow(0 0 10px rgba(120,255,255,0.25))";
                }
            });

            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [phase, spinUpMs]);

    return (
        <div className="pointer-events-none absolute inset-0 z-[2]">
            <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: "var(--ring)", height: "var(--ring)" }}
            >
                <RingLayer
                    sizeCss={"var(--ring)"}
                    borderClass={"border-white/14"}
                    ringRef={(el) => {
                        ringEls.current[0] = el;
                    }}
                    dotARef={(el) => {
                        dotEls.current[0] = el;
                        const cfg = cfgRef.current?.[0];
                        if (el && cfg) {
                            el.style.transform = `rotate(${cfg.startDeg}deg)`;
                            el.style.animation = `orbitVar ${cfg.baseDurSec}s linear infinite`;
                            el.style.animationDirection = cfg.dir === 1 ? "normal" : "reverse";
                        }
                    }}
                    dotBRef={(el) => {
                        dotEls.current[1] = el;
                        const cfg = cfgRef.current?.[1];
                        if (el && cfg) {
                            el.style.transform = `rotate(${cfg.startDeg}deg)`;
                            el.style.animation = `orbitVar ${cfg.baseDurSec}s linear infinite`;
                            el.style.animationDirection = cfg.dir === 1 ? "normal" : "reverse";
                        }
                    }}
                    tailARef={(el) => {
                        tailEls.current[0] = el;
                    }}
                    tailBRef={(el) => {
                        tailEls.current[1] = el;
                    }}
                    dotSize={9}
                />

                <RingLayer
                    sizeCss={"calc(var(--ring) * 0.75)"}
                    borderClass={"border-white/12"}
                    ringRef={(el) => {
                        ringEls.current[1] = el;
                    }}
                    dotARef={(el) => {
                        dotEls.current[2] = el;
                        const cfg = cfgRef.current?.[2];
                        if (el && cfg) {
                            el.style.transform = `rotate(${cfg.startDeg}deg)`;
                            el.style.animation = `orbitVar ${cfg.baseDurSec}s linear infinite`;
                            el.style.animationDirection = cfg.dir === 1 ? "normal" : "reverse";
                        }
                    }}
                    dotBRef={(el) => {
                        dotEls.current[3] = el;
                        const cfg = cfgRef.current?.[3];
                        if (el && cfg) {
                            el.style.transform = `rotate(${cfg.startDeg}deg)`;
                            el.style.animation = `orbitVar ${cfg.baseDurSec}s linear infinite`;
                            el.style.animationDirection = cfg.dir === 1 ? "normal" : "reverse";
                        }
                    }}
                    tailARef={(el) => {
                        tailEls.current[2] = el;
                    }}
                    tailBRef={(el) => {
                        tailEls.current[3] = el;
                    }}
                    dotSize={7}
                />

                <RingLayer
                    sizeCss={"calc(var(--ring) * 0.5)"}
                    borderClass={"border-white/10"}
                    ringRef={(el) => {
                        ringEls.current[2] = el;
                    }}
                    dotARef={(el) => {
                        dotEls.current[4] = el;
                        const cfg = cfgRef.current?.[4];
                        if (el && cfg) {
                            el.style.transform = `rotate(${cfg.startDeg}deg)`;
                            el.style.animation = `orbitVar ${cfg.baseDurSec}s linear infinite`;
                            el.style.animationDirection = cfg.dir === 1 ? "normal" : "reverse";
                        }
                    }}
                    dotBRef={(el) => {
                        dotEls.current[5] = el;
                        const cfg = cfgRef.current?.[5];
                        if (el && cfg) {
                            el.style.transform = `rotate(${cfg.startDeg}deg)`;
                            el.style.animation = `orbitVar ${cfg.baseDurSec}s linear infinite`;
                            el.style.animationDirection = cfg.dir === 1 ? "normal" : "reverse";
                        }
                    }}
                    tailARef={(el) => {
                        tailEls.current[4] = el;
                    }}
                    tailBRef={(el) => {
                        tailEls.current[5] = el;
                    }}
                    dotSize={6}
                />
            </div>
        </div>
    );
}

export default function StartPage() {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>("idle");
    const timersRef = useRef<number[]>([]);

    const copy = useMemo(
        () => ({
            kicker: "PORTFOLIO SITE",
            title: "Kamijo Haruto / 上條 遥都",
            sub: "Designer / Developer / Creator",
            tagline: "可能性という名の宇宙を進み続ける",
            cta: "GO TO SPACE",
            hint: "Click / Space",
        }),
        []
    );

    const clearTimers = () => {
        timersRef.current.forEach((id) => clearTimeout(id));
        timersRef.current = [];
    };

    const goNext = useCallback(() => {
        setPhase((p) => (p === "idle" ? "spinup" : p));
        clearTimers();

        timersRef.current.push(window.setTimeout(() => setPhase("flash"), 5000));
        timersRef.current.push(window.setTimeout(() => setPhase("warp"), 5120));
        timersRef.current.push(window.setTimeout(() => router.push("/home"), 5600));
    }, [router]);

    useEffect(() => () => clearTimers(), []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                e.preventDefault();
                goNext();
            }
        };
        window.addEventListener("keydown", onKey, { passive: false });
        return () => window.removeEventListener("keydown", onKey);
    }, [goNext]);

    const isEntering = phase !== "idle";

    const bgClass =
        phase === "idle"
            ? "scale-100 brightness-100"
            : phase === "spinup"
                ? "scale-[1.12] brightness-110"
                : phase === "flash"
                    ? "scale-[1.18] brightness-125"
                    : "scale-[1.30] brightness-120";

    const bgDuration = phase === "spinup" ? "duration-[5000ms]" : "duration-[800ms]";

    return (
        <main className="relative min-h-screen overflow-hidden bg-black">
            <div
                className={[
                    "fixed inset-0 z-0 will-change-transform",
                    "transition-[transform,filter] ease-out",
                    bgDuration,
                    bgClass,
                ].join(" ")}
            >
                <SpaceCanvas />
            </div>

            <div
                className={[
                    "pointer-events-none fixed inset-0 z-[1]",
                    "bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.25),transparent_55%)]",
                    "transition-opacity duration-700",
                    isEntering ? "opacity-0" : "opacity-100",
                ].join(" ")}
            />

            <div className="relative z-[3] flex min-h-screen items-center justify-center">
                <div className="relative" style={{ ["--ring" as any]: "min(90svh,84vw,720px)" }}>
                    <ContentRings phase={phase} spinUpMs={5000} />

                    <div
                        className={[
                            "relative z-[3] text-center",
                            "transition-opacity duration-700 ease-out",
                            phase === "idle" ? "opacity-100" : "opacity-0",
                        ].join(" ")}
                    >
                        <p className="text-xs tracking-[0.4em] text-cyan-100/60 drop-shadow-[0_0_12px_rgba(120,255,255,0.16)]">
                            {copy.kicker}
                        </p>
                        <h1 className="mt-5 text-2xl text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.3)]">
                            {copy.title}
                        </h1>
                        <p className="mt-3 text-slate-300">{copy.sub}</p>
                        <p className="mt-6 text-slate-200">{copy.tagline}</p>

                        <div className="mt-7 flex items-center justify-center gap-3">
                            <button
                                onClick={goNext}
                                className={[
                                    "rounded-full border border-cyan-200/30 px-6 py-2",
                                    "text-xs tracking-widest text-white",
                                    "shadow-[0_0_20px_rgba(120,255,255,0.25)]",
                                    "hover:shadow-[0_0_30px_rgba(120,255,255,0.40)]",
                                ].join(" ")}
                            >
                                {copy.cta}
                            </button>

                            <span className="text-[10px] tracking-[0.22em] text-cyan-100/55">{copy.hint}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                className={[
                    "pointer-events-none fixed inset-0 z-[6] bg-white",
                    "transition-opacity duration-150",
                    phase === "flash" ? "opacity-100" : "opacity-0",
                ].join(" ")}
            />

            <div
                className={[
                    "pointer-events-none fixed inset-0 z-[7] bg-black",
                    "transition-opacity duration-700",
                    phase === "warp" ? "opacity-100" : "opacity-0",
                ].join(" ")}
            />
        </main>
    );
}
