// src/app/admin/contacts/page.tsx

import type { Metadata } from "next";

import { ContactList } from "@/components/admin/ContactList";
import { listContacts } from "@/lib/admin/contacts";

/** 認証を通った後にだけ描画されるため、ここでタイトルを付けても存在は漏れない */
export const metadata: Metadata = {
    title: "受信箱",
    robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
    const contacts = await listContacts();
    const unread = contacts.filter((c) => !c.read).length;

    return (
        <div className="mx-auto max-w-5xl px-5 py-10">
            <div className="mb-8 flex flex-wrap items-baseline gap-4">
                <h1 className="text-lg tracking-[0.24em] text-white">受信箱</h1>
                <p className="text-xs text-white/40">
                    {contacts.length} 件{unread > 0 && ` / 未読 ${unread} 件`}
                </p>
            </div>

            <ContactList contacts={contacts} />
        </div>
    );
}
