// src/components/catalog/CatalogNav.tsx
import Link from "next/link";
import { getDictionary } from "@/lib/dictionary";
import { Locale, localizePath } from "@/lib/i18n";

/** デザインカタログの「ページ」と「パーツ図鑑」の切り替え。/portfolio のタブと同じ見た目にする */
export const CatalogNav = ({ lang, active }: { lang: Locale; active: "pages" | "parts" }) => {
    const t = getDictionary(lang).catalog;
    const items = [
        { key: "pages", label: t.pages, href: "/catalog" },
        { key: "parts", label: t.parts, href: "/catalog/parts" },
    ] as const;
    return (
        <nav className="mb-8 flex flex-wrap gap-2 sm:mb-10" aria-label={t.viewsLabel}>
            {items.map((item) => (
                <Link
                    key={item.key}
                    href={localizePath(item.href, lang)}
                    aria-current={item.key === active ? "page" : undefined}
                    className={`rounded-full border px-4 py-2 text-xs tracking-widest transition-colors ${
                        item.key === active
                            ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-200"
                            : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                    }`}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
};
