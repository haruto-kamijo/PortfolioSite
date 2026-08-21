// src/components/ui/SectionTitle.tsx

/** セクション見出し。英語表記＋日本語の補足という体裁を全ページで揃える */
export const SectionTitle = ({ en, ja }: { en: string; ja: string }) => (
    <div className="mb-6 flex items-baseline gap-4">
        <h2 className="text-xl tracking-[0.28em] text-white">{en}</h2>
        <span className="text-xs tracking-[0.2em] text-cyan-100/50">{ja}</span>
    </div>
);
