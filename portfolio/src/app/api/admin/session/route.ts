// src/app/api/admin/session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, createAdminSession } from "@/lib/admin/session";

/**
 * 管理画面のログイン / ログアウト。
 *
 * POST: クライアントで Google ログインして得た ID トークンを受け取り、
 *       サーバーで検証してセッションCookieを発行する。
 * DELETE: セッションCookieを消す。
 *
 * 失敗時の応答は理由を区別せず常に同じにしている。
 * 「メールアドレスは合っているが許可されていない」等を返すと、
 * 管理者のアドレスを推測する手がかりを与えてしまうため。
 */

const FAILED = { ok: false, error: "ログインできませんでした" };

export async function POST(req: NextRequest) {
    let idToken: string | undefined;

    try {
        const body = (await req.json()) as { idToken?: unknown };
        if (typeof body.idToken === "string" && body.idToken) idToken = body.idToken;
    } catch {
        return NextResponse.json(FAILED, { status: 400 });
    }

    if (!idToken) return NextResponse.json(FAILED, { status: 400 });

    const session = await createAdminSession(idToken);
    if (!session) return NextResponse.json(FAILED, { status: 401 });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
        name: ADMIN_SESSION_COOKIE,
        value: session.cookie,
        httpOnly: true,
        // 本番は HTTPS のみ。ローカルの http://localhost では付けない
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: session.maxAgeSec,
    });

    return res;
}

export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set({
        name: ADMIN_SESSION_COOKIE,
        value: "",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
    return res;
}
