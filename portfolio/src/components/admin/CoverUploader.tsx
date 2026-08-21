// src/components/admin/CoverUploader.tsx
"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

/** ブラウザ側でも画像サイズ・種類を確認する。実際の制限は storage.rules 側にもある */
const MAX_COVER_BYTES = 5 * 1024 * 1024;

type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * カバー画像のアップローダー。作品(works)とポートフォリオ項目(portfolioItems)の
 * どちらでも使えるよう、Storageのパスと保存先アクションを外から渡す形にしている。
 */
export const CoverUploader = ({
                                  storagePath,
                                  coverUrl,
                                  onUploaded,
                                  onCleared,
                              }: {
    /** 例: `works/{id}/cover` */
    storagePath: string;
    coverUrl: string | null;
    onUploaded: (url: string) => Promise<SaveResult>;
    onCleared: () => Promise<SaveResult>;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    const handleFile = async (file: File) => {
        setError(null);

        if (!file.type.startsWith("image/")) {
            setError("画像ファイルを選択してください");
            return;
        }
        if (file.size > MAX_COVER_BYTES) {
            setError("5MB以下の画像にしてください");
            return;
        }

        const storage = getFirebaseStorage();
        if (!storage) {
            setError("設定が読み込めませんでした");
            return;
        }

        setUploading(true);
        try {
            // 常に同じパスに上書きする。世代管理はせず、常に1枚だけ持つ
            const fileRef = ref(storage, storagePath);
            await uploadBytes(fileRef, file, { contentType: file.type });
            const url = await getDownloadURL(fileRef);

            const res = await onUploaded(url);
            if (!res.ok) setError(res.error);
        } catch (err) {
            console.error(err);
            setError("アップロードに失敗しました");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
                {coverUrl ? (
                    <Image
                        src={coverUrl}
                        alt=""
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        unoptimized
                    />
                ) : (
                    <span className="text-[10px] text-white/25">画像なし</span>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(file);
                }}
            />
            <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="text-[11px] text-cyan-200/80 underline decoration-cyan-200/30 underline-offset-4 transition-colors hover:text-cyan-200 disabled:opacity-40"
            >
                {uploading ? "アップロード中..." : coverUrl ? "差し替え" : "画像を選択"}
            </button>

            {coverUrl && !uploading && (
                <button
                    type="button"
                    onClick={() => startTransition(async () => void (await onCleared()))}
                    className="text-[11px] text-white/35 transition-colors hover:text-rose-300"
                >
                    削除
                </button>
            )}

            {error && <p className="max-w-[6rem] text-center text-[10px] text-rose-300">{error}</p>}
        </div>
    );
};
