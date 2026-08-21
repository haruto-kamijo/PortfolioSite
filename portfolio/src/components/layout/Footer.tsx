// src/components/layout/Footer.tsx
import { links, site } from "@/lib/site";

export const Footer = () => {
    const year = new Date().getFullYear();
    const period = year > site.copyrightSince ? `${site.copyrightSince}-${year}` : `${year}`;

    return (
        <footer className="border-t border-white/10 bg-black/30 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-6 text-xs text-white/50 sm:flex-row sm:justify-between">
                <p>&copy; {period} Haruto Kamijo. All rights reserved.</p>
                <div className="flex gap-5">
                    <a
                        href={links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-cyan-200"
                    >
                        GitHub
                    </a>
                    <a
                        href={links.note}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-cyan-200"
                    >
                        note
                    </a>
                    <a
                        href={`mailto:${links.mail}`}
                        className="transition-colors hover:text-cyan-200"
                    >
                        Mail
                    </a>
                </div>
            </div>
        </footer>
    );
};
