// src/components/ui/Panel.tsx
import React from "react";

/**
 * 星空背景の上に置く半透明パネル。
 * 背景を透かしつつ文字の可読性を確保するため、全ページでこのコンポーネントを使う。
 */
export const Panel = ({
                          children,
                          className = "",
                          as: Tag = "div",
                      }: {
    children: React.ReactNode;
    className?: string;
    as?: "div" | "section" | "article" | "li";
}) => (
    <Tag
        className={[
            "rounded-2xl border border-white/10 bg-white/[0.04]",
            "shadow-[0_0_40px_rgba(120,255,255,0.05)] backdrop-blur-[2px]",
            className,
        ].join(" ")}
    >
        {children}
    </Tag>
);
