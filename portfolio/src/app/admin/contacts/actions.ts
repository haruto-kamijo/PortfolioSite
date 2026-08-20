"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { collections } from "@/lib/content/types";

/**
 * 受信箱の更新処理（Server Actions）。
 *
 * Server Actions は実質「公開されたエンドポイント」なので、
 * 画面に入れたかどうかとは別に、必ずここで権限を再確認する。
 * レイアウトで弾いているから安全、とは考えない。
 */

const requireAdmin = async () => {
    const user = await getAdminUser();
    if (!user) throw new Error("権限がありません");
    return user;
};

/** ドキュメントIDにスラッシュ等が混ざると別のパスを触れてしまうため検証する */
const assertDocId = (id: string) => {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("IDが不正です");
};

export async function setContactRead(id: string, read: boolean) {
    await requireAdmin();
    assertDocId(id);

    const db = getAdminDb();
    if (!db) throw new Error("データベースに接続できません");

    await db.collection(collections.contacts).doc(id).update({ read });
    revalidatePath("/admin/contacts");
    revalidatePath("/admin");
}

export async function deleteContact(id: string) {
    await requireAdmin();
    assertDocId(id);

    const db = getAdminDb();
    if (!db) throw new Error("データベースに接続できません");

    await db.collection(collections.contacts).doc(id).delete();
    revalidatePath("/admin/contacts");
    revalidatePath("/admin");
}
