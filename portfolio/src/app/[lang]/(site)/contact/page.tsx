// src/app/[lang]/(site)/contact/page.tsx
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getDictionary } from "@/lib/dictionary";
import { DEFAULT_LOCALE, alternatesFor, isLocale } from "@/lib/i18n";
import { links } from "@/lib/site";

type Props = { params: { lang: string } };

const langOf = (params: Props["params"]) => (isLocale(params.lang) ? params.lang : DEFAULT_LOCALE);

export const generateMetadata = ({ params }: Props): Metadata => {
    const lang = langOf(params);
    const t = getDictionary(lang).meta;
    return {
        title: t.contact,
        description: t.contactDescription,
        alternates: alternatesFor("/contact", lang),
    };
};

export default function ContactPage({ params }: Props) {
    const lang = langOf(params);
    const t = getDictionary(lang).contact;

    return (
        <div className="mx-auto max-w-3xl px-5 py-12 sm:py-24">
            <div className="mb-4">
                <SectionTitle as="h1" {...t.heading} />
            </div>

            <p className="mb-8 text-sm leading-relaxed text-slate-300 sm:mb-10">{t.lead}</p>

            <Panel className="p-5 sm:p-10">
                <ContactForm lang={lang} />
            </Panel>

            <div className="mt-10 text-xs text-white/40">
                <p>
                    {t.fallbackBefore}{" "}
                    <a
                        href={`mailto:${links.mail}`}
                        className="break-all text-cyan-200/70 underline decoration-cyan-200/30 underline-offset-4 transition-colors hover:text-cyan-200"
                    >
                        {links.mail}
                    </a>
                    {lang === "ja" ? " " : ""}
                    {t.fallbackAfter}
                </p>
            </div>
        </div>
    );
}
