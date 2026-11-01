// src/components/layout/Footer.tsx
import { links, site } from "@/lib/site";

/** 著作権表記とリンク。リンク名は固有名詞なので、日英で同じ表記にしている */
export const Footer = () => {
    const year = new Date().getFullYear();
    const period = year > site.copyrightSince ? `${site.copyrightSince}-${year}` : `${year}`;

    // スマホでも押しやすいよう、文字の周りに余白をとってタップできる範囲を広げる
    const linkClass = "px-1 py-2 transition-colors hover:text-cyan-200";

    return (
        <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-6 text-xs text-white/50 sm:flex-row sm:justify-between">
                <p>&copy; {period} Haruto Kamijo. All rights reserved.</p>
                <div className="flex gap-4">
                    <a href={links.github} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        GitHub
                    </a>
                    <a href={links.zenn} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        Zenn
                    </a>
                    <a href={links.note} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        note
                    </a>
                    <a href={`mailto:${links.mail}`} className={linkClass}>
                        Mail
                    </a>
                </div>
            </div>
        </footer>
    );
};
