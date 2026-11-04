// src/components/portfolio/PortfolioCard.tsx
import Image from "next/image";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { PORTFOLIO_CATEGORY_LABELS, PortfolioItem } from "@/lib/content/types";
import { MAX_SELECTED_TAGS, toggleTagHref } from "@/lib/content/tags";
import { getDictionary } from "@/lib/dictionary";
import { Locale, localizePath, pick } from "@/lib/i18n";

/**
 * サイト内のパス（/catalog など）か。//example.com や /\example.com はブラウザが別のサイトとして扱うので外す
 * （制御文字の混じった値も、ブラウザが取り除いて同じ形になるため外す）
 */
const isInternalPath = (href: string) => /^\/(?![/\\])/.test(href) && !/[\u0000-\u001f\u007f]/.test(href);

/** 日付は日本時間で出す（UTC のまま切ると、朝に出した記事が前の日になる） */
const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date(iso)).replace(/-/g, ".");

/**
 * 作品1件のカード。/portfolio の一覧とホームの「最近の更新」で使う。
 * showCategory はカテゴリをまたいで並べるとき（ホーム・タグでの絞り込み）に、どのタブの作品かを出す。
 * タグを押すと、そのタグで絞り込んだ /portfolio を開く。selectedTags は今選んでいるタグで、押すとそこに足す（選んでいれば外す）
 */
export const PortfolioCard = ({
    item,
    lang,
    showDate = false,
    showCategory = false,
    selectedTags = [],
}: {
    item: PortfolioItem;
    lang: Locale;
    showDate?: boolean;
    showCategory?: boolean;
    selectedTags?: string[];
}) => {
    const t = getDictionary(lang).portfolio;
    const caption = pick(item.caption, lang);
    const meta = [
        showCategory ? PORTFOLIO_CATEGORY_LABELS[item.category][lang] : null,
        showDate && item.createdAt ? formatDate(item.createdAt) : null,
    ].filter(Boolean);

    const body = (
        <>
            <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
                {item.coverUrl ? (
                    <Image
                        src={item.coverUrl}
                        alt=""
                        width={400}
                        height={240}
                        className="h-full w-full object-cover"
                        unoptimized
                    />
                ) : (
                    <span className="text-[11px] text-white/25">{t.noImage}</span>
                )}
            </div>
            {meta.length > 0 && (
                <p className="mt-4 text-[10px] tracking-[0.2em] text-cyan-100/60">{meta.join(" · ")}</p>
            )}
            <p className={`${meta.length > 0 ? "mt-1.5" : "mt-4"} text-base text-white`}>{pick(item.title, lang)}</p>
            {caption && <p className="mt-2 text-xs text-slate-400">{caption}</p>}
        </>
    );
    const full = selectedTags.length >= MAX_SELECTED_TAGS;

    return (
        <Panel as="li" className={item.href ? "transition-colors hover:border-cyan-200/40" : ""}>
            {/* サイト内のページ（/catalog など）は同じタブで、表示中の言語のまま開く */}
            {item.href && isInternalPath(item.href) ? (
                <Link href={localizePath(item.href, lang)} className="block p-5">
                    {body}
                </Link>
            ) : item.href ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="block p-5">
                    {body}
                </a>
            ) : (
                <div className="p-5">{body}</div>
            )}
            {/* カード全体のリンクの中にリンクは入れられないので、タグと補助リンクは外に並べる */}
            {item.tags.length > 0 && (
                <ul className={`-mt-2 flex flex-wrap gap-1.5 px-5 ${item.links.length > 0 ? "pb-4" : "pb-5"}`} aria-label={t.tagsLabel}>
                    {item.tags.map((tag) => {
                        const selected = selectedTags.includes(tag);
                        const chip = `rounded-full px-2.5 py-1 text-[10px] tracking-wider ${
                            selected ? "bg-cyan-200/20 text-cyan-100" : "bg-cyan-200/[0.07] text-cyan-100/70"
                        }`;
                        return (
                            <li key={tag} className="flex">
                                {/* 選べる数を超えるタグは足せないので、押せない見た目のまま出す */}
                                {full && !selected ? (
                                    <span className={chip}>{tag}</span>
                                ) : (
                                    <Link
                                        href={toggleTagHref(selectedTags, tag, lang)}
                                        aria-label={(selected ? t.tagRemove : t.tagAdd).replace("{tag}", tag)}
                                        aria-current={selected ? "true" : undefined}
                                        className={`${chip} transition-colors hover:bg-cyan-200/25 hover:text-cyan-50`}
                                    >
                                        {tag}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
            {item.links.length > 0 && (
                <div className="-mt-1 flex flex-wrap gap-2 px-5 pb-5">
                    {item.links.map((link, i) => (
                        <a
                            key={`${i}-${link.href}`}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] tracking-wider text-white/70 transition-colors hover:border-cyan-200/40 hover:text-cyan-200"
                        >
                            {pick(link.label, lang)} ↗
                        </a>
                    ))}
                </div>
            )}
        </Panel>
    );
};
