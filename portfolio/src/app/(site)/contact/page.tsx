// src/app/(site)/contact/page.tsx
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { Panel } from "@/components/ui/Panel";
import { links } from "@/lib/site";

export const metadata: Metadata = {
    title: "Contact",
    description: "上條遥都へのお問い合わせフォーム。制作のご相談はこちらから。",
};

export default function ContactPage() {
    return (
        <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
            <div className="mb-10 flex items-baseline gap-4">
                <h1 className="text-xl tracking-[0.28em] text-white">CONTACT</h1>
                <span className="text-xs tracking-[0.2em] text-cyan-100/50">お問い合わせ</span>
            </div>

            <p className="mb-10 text-sm leading-relaxed text-slate-300">
                制作のご相談・ご依頼、その他のご連絡はこちらからお願いします。
                内容を確認のうえ、ご記入いただいたメールアドレスに返信します。
            </p>

            <Panel className="p-6 sm:p-10">
                <ContactForm />
            </Panel>

            <div className="mt-10 text-xs text-white/40">
                <p>
                    フォームがうまく動かない場合は{" "}
                    <a
                        href={`mailto:${links.mail}`}
                        className="text-cyan-200/70 underline decoration-cyan-200/30 underline-offset-4 transition-colors hover:text-cyan-200"
                    >
                        {links.mail}
                    </a>{" "}
                    まで直接ご連絡ください。
                </p>
            </div>
        </div>
    );
}
