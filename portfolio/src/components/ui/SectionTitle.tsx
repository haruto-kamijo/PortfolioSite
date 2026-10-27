// src/components/ui/SectionTitle.tsx

/**
 * セクション見出し。表示中の言語の見出しを大きく、補足を横に小さく添える体裁を全ページで揃える。
 * as="h1" はページの主見出しとして使う場合（/contact など）。
 */
export const SectionTitle = ({
                                 title,
                                 sub,
                                 as: Tag = "h2",
                             }: {
    title: string;
    sub: string;
    as?: "h1" | "h2";
}) => (
    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {/* 英字の見出しは字間を大きく空けるが、日本語は間延びして読みにくくなるので詰める */}
        <Tag className="text-xl tracking-[0.28em] text-white [&:lang(ja)]:tracking-[0.12em]">{title}</Tag>
        <span className="text-xs tracking-[0.2em] text-cyan-100/50">{sub}</span>
    </div>
);
