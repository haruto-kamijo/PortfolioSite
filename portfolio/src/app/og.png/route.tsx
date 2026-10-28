// src/app/og.png/route.tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

/**
 * リンクを貼ったときに出る画像（OGP 画像、1200×630）。ビルド時に1回だけ作る。
 * 拡張子付きのパスなので middleware の言語の振り分けを通らず、日英で同じ画像を使う。
 * 標準のフォントは日本語を含まないため、文字はローマ字と英語だけにしている
 */
export const dynamic = "force-static";

// route.tsx からは決まった名前しか export できないので、大きさは metadata.ts の OG_IMAGE と揃えて書く
const SIZE = { width: 1200, height: 630 };

// 星の位置は毎回同じにする（ビルドのたびに画像が変わらないように）
let seed = 20241;
const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
};
const STARS = Array.from({ length: 70 }, () => ({
    left: Math.floor(random() * SIZE.width),
    top: Math.floor(random() * SIZE.height),
    size: random() < 0.12 ? 3 : random() < 0.4 ? 2 : 1,
    opacity: 0.25 + random() * 0.6,
}));

export async function GET() {
    const logo = await readFile(join(process.cwd(), "public", "logo.png"));
    const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    position: "relative",
                    background: "radial-gradient(circle at 30% 40%, #0d2a3a 0%, #060814 55%, #020308 100%)",
                    color: "white",
                }}
            >
                {STARS.map((s, i) => (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: s.left,
                            top: s.top,
                            width: s.size,
                            height: s.size,
                            borderRadius: 9999,
                            background: "white",
                            opacity: s.opacity,
                        }}
                    />
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 56, padding: "0 96px" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- next/og は img 要素で描く */}
                    <img src={logoSrc} width={220} height={220} alt="" />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: 22, letterSpacing: 10, color: "rgba(165, 243, 252, 0.75)" }}>PORTFOLIO</div>
                        <div style={{ marginTop: 16, fontSize: 76, letterSpacing: 2 }}>{site.name}</div>
                        <div style={{ marginTop: 20, fontSize: 30, letterSpacing: 3, color: "rgba(226, 232, 240, 0.85)" }}>
                            {site.role.en}
                        </div>
                        <div style={{ marginTop: 48, fontSize: 24, letterSpacing: 4, color: "rgba(165, 243, 252, 0.6)" }}>
                            {site.url.replace(/^https:\/\//, "")}
                        </div>
                    </div>
                </div>
            </div>
        ),
        SIZE
    );
}
