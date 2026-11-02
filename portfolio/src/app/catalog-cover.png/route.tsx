// src/app/catalog-cover.png/route.tsx
import { ImageResponse } from "next/og";

/**
 * 制作物のカードに出す、デザインカタログのカバー画像（800×400。カードの画像の枠と同じ 2:1）。ビルド時に1回だけ作る。
 * 4つの見本のページの配色を田の字に並べる。標準のフォントは日本語を含まないため、文字は英語だけにしている
 */
export const dynamic = "force-static";

const SIZE = { width: 800, height: 400 };

// 見本のページ（lib/catalog/concepts.ts）の背景・文字・差し色と揃える
const TILES = [
    { label: "Japanese modern", bg: "#f4efe6", fg: "#2b2622", accent: "#b5452c" },
    { label: "Glassmorphism", bg: "linear-gradient(135deg, #312e81, #7c3aed 55%, #ec4899)", fg: "#ffffff", accent: "#f9a8d4" },
    { label: "Brutalism", bg: "#ffe500", fg: "#111111", accent: "#111111" },
    { label: "Minimal", bg: "#fafaf9", fg: "#1c1917", accent: "#a8a29e" },
];

export async function GET() {
    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", flexWrap: "wrap", position: "relative", background: "#060814" }}>
                {TILES.map((tile, i) => (
                    <div
                        key={tile.label}
                        style={{
                            width: "50%",
                            height: "50%",
                            display: "flex",
                            // 真ん中の題字に隠れないよう、上の段は上端、下の段は下端に名前を置く
                            alignItems: i < 2 ? "flex-start" : "flex-end",
                            padding: 24,
                            background: tile.bg,
                            color: tile.fg,
                            fontSize: 22,
                            letterSpacing: 2,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 14, height: 14, borderRadius: 9999, background: tile.accent }} />
                            {tile.label}
                        </div>
                    </div>
                ))}
                <div
                    style={{
                        position: "absolute",
                        left: 200,
                        top: 160,
                        width: 400,
                        height: 80,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#060814",
                        color: "#a5f3fc",
                        border: "2px solid rgba(165, 243, 252, 0.6)",
                        borderRadius: 16,
                        fontSize: 26,
                        letterSpacing: 6,
                    }}
                >
                    DESIGN CATALOG
                </div>
            </div>
        ),
        SIZE
    );
}
