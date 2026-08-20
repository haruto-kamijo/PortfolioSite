"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/session";
import { getAdminBucket, getAdminDb } from "@/lib/firebase/admin";
import { collections } from "@/lib/content/types";

/**
 * 作品管理の更新処理（Server Action）。
 *
 * 受信箱・プロフィールと同じ方針で、画面の認証状態とは別に
 * 各アクション内で必ず権限を再確認する。検証エラーは throw せず結果として返す
 * （本番ビルドで Server Action の Error メッセージが握りつぶされることがあるため）。
 */

const LIMITS = { title: 100, caption: 300, href: 500 } as const;

export type SaveResult = { ok: true } | { ok: false; error: string };

const requireAdmin = async () => {
    const user = await getAdminUser();
    if (!user) throw new Error("権限がありません");
};

/** ドキュメントIDにスラッシュ等が混ざると別のパスを触れてしまうため検証する */
const assertDocId = (id: string) => {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("IDが不正です");
};

/** カバー画像の Storage オブジェクトパス。work 1件につき1枚だけ持つ */
const coverPath = (id: string) => `works/${id}/cover`;

type WorkFields = {
    title: string;
    caption: string;
    href: string;
    external: boolean;
    ready: boolean;
};

const validateFields = ({ title, caption, href, external }: WorkFields): string | null => {
    if (!title.trim()) return "タイトルを入力してください";
    if (title.length > LIMITS.title) return "タイトルが長すぎます";
    if (caption.length > LIMITS.caption) return "説明文が長すぎます";
    if (!href.trim()) return "リンク先を入力してください";
    if (href.length > LIMITS.href) return "リンク先が長すぎます";

    // Link/<a> のどちらでレンダリングするか(external)と実際のURL形式がずれると
    // 公開ページで壊れたリンクになるため、ここで整合性を確認する
    if (external && !/^https?:\/\//.test(href)) {
        return "外部リンクは http:// か https:// から始めてください";
    }
    if (!external && !href.startsWith("/")) {
        return "内部リンクは / から始めてください";
    }
    return null;
};

export async function createWork(input: WorkFields): Promise<SaveResult> {
    await requireAdmin();

    const fields = {
        title: input.title.trim(),
        caption: input.caption.trim(),
        href: input.href.trim(),
        external: input.external,
        ready: input.ready,
    };
    const error = validateFields(fields);
    if (error) return { ok: false, error };

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        const lastSnap = await db
            .collection(collections.works)
            .orderBy("order", "desc")
            .limit(1)
            .get();
        const nextOrder = lastSnap.empty ? 0 : (lastSnap.docs[0].data().order ?? 0) + 1;

        await db.collection(collections.works).add({ ...fields, order: nextOrder, coverUrl: null });
    } catch (err) {
        console.error("[admin] 作品の作成に失敗しました:", err);
        return { ok: false, error: "作成に失敗しました" };
    }

    revalidatePath("/admin/works");
    revalidatePath("/home");
    return { ok: true };
}

export async function updateWork(id: string, input: WorkFields): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    const fields = {
        title: input.title.trim(),
        caption: input.caption.trim(),
        href: input.href.trim(),
        external: input.external,
        ready: input.ready,
    };
    const error = validateFields(fields);
    if (error) return { ok: false, error };

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db.collection(collections.works).doc(id).update(fields);
    } catch (err) {
        console.error("[admin] 作品の更新に失敗しました:", err);
        return { ok: false, error: "更新に失敗しました" };
    }

    revalidatePath("/admin/works");
    revalidatePath("/home");
    return { ok: true };
}

export async function deleteWork(id: string): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db.collection(collections.works).doc(id).delete();
    } catch (err) {
        console.error("[admin] 作品の削除に失敗しました:", err);
        return { ok: false, error: "削除に失敗しました" };
    }

    // カバー画像も片付ける。無くても失敗として扱わない
    const bucket = getAdminBucket();
    if (bucket) {
        await bucket.file(coverPath(id)).delete({ ignoreNotFound: true }).catch((err: unknown) => {
            console.warn("[admin] カバー画像の削除に失敗しました:", err);
        });
    }

    revalidatePath("/admin/works");
    revalidatePath("/home");
    return { ok: true };
}

/**
 * 表示順を1つ上/下と入れ替える。
 * 端（先頭で up、末尾で down）は何もせず成功を返す。
 */
export async function moveWork(id: string, direction: "up" | "down"): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        const snap = await db.collection(collections.works).orderBy("order").get();
        const docs = snap.docs;
        const index = docs.findIndex((d) => d.id === id);
        if (index < 0) return { ok: false, error: "見つかりませんでした" };

        const swapIndex = direction === "up" ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= docs.length) return { ok: true };

        const a = docs[index];
        const b = docs[swapIndex];
        const batch = db.batch();
        batch.update(a.ref, { order: b.data().order });
        batch.update(b.ref, { order: a.data().order });
        await batch.commit();
    } catch (err) {
        console.error("[admin] 並び替えに失敗しました:", err);
        return { ok: false, error: "並び替えに失敗しました" };
    }

    revalidatePath("/admin/works");
    revalidatePath("/home");
    return { ok: true };
}

/**
 * カバー画像のURLを保存する。
 * 画像そのもののアップロードはクライアントから Storage へ直接行い（storage.rules が保護する）、
 * ここでは得られたダウンロードURLを Firestore に記録するだけ。
 */
export async function setWorkCover(id: string, url: string): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    // 自分のバケット以外のURLが紛れ込まないように確認する
    if (typeof url !== "string" || url.length > 2000 || !url.startsWith("https://firebasestorage.googleapis.com/")) {
        return { ok: false, error: "画像のURLが不正です" };
    }

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db.collection(collections.works).doc(id).update({ coverUrl: url });
    } catch (err) {
        console.error("[admin] カバー画像の保存に失敗しました:", err);
        return { ok: false, error: "保存に失敗しました" };
    }

    revalidatePath("/admin/works");
    revalidatePath("/home");
    return { ok: true };
}

export async function clearWorkCover(id: string): Promise<SaveResult> {
    await requireAdmin();
    assertDocId(id);

    const db = getAdminDb();
    if (!db) return { ok: false, error: "データベースに接続できません" };

    try {
        await db.collection(collections.works).doc(id).update({ coverUrl: null });
    } catch (err) {
        console.error("[admin] カバー画像の削除に失敗しました:", err);
        return { ok: false, error: "削除に失敗しました" };
    }

    const bucket = getAdminBucket();
    if (bucket) {
        await bucket.file(coverPath(id)).delete({ ignoreNotFound: true }).catch((err: unknown) => {
            console.warn("[admin] Storage 上のカバー画像の削除に失敗しました:", err);
        });
    }

    revalidatePath("/admin/works");
    revalidatePath("/home");
    return { ok: true };
}
