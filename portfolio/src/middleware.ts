// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/cookieName";

/**
 * /admin の存在を隠すための前段。
 *
 * Cookie が無いリクエストは、存在しないパスへ rewrite して通常の 404 を返す。
 * こうすると「存在しないURL」と応答が完全に一致するため、
 * /admin に何かがあると推測できなくなる。
 * （レイアウトから notFound() を投げると Next 内部のエラー用シェルが返り、
 *   通常の 404 と HTML 構造が変わってしまう）
 *
 * ここでは Cookie の有無しか見ない。middleware は Edge ランタイムで動き
 * firebase-admin が使えないため、署名の検証はできない。
 * 実際の検証は app/admin/layout.tsx がサーバー側で行う。
 * つまりこれは目隠しであって、認可の実体ではない。
 */
export function middleware(req: NextRequest) {
    if (!req.cookies.has(ADMIN_SESSION_COOKIE)) {
        return NextResponse.rewrite(new URL("/__not_found__", req.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/admin", "/admin/:path*"],
};
