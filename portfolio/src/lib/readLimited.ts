// src/lib/readLimited.ts

/**
 * リクエストの本文を max バイトまで読む。超えたらその時点で読むのをやめて null。
 * Content-Length は送り手が申告する値で、省略もできる（chunked）ので、実際に読んだバイト数で数える
 */
export const readLimited = async (req: Request, max: number): Promise<string | null> => {
    const reader = req.body?.getReader();
    if (!reader) return "";
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > max) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }
    return Buffer.concat(chunks).toString("utf8");
};
