// src/components/admin/PortfolioItemsManager.tsx
"use client";

import { useState, useTransition } from "react";
import { Panel } from "@/components/ui/Panel";
import { CoverUploader } from "@/components/admin/CoverUploader";
import {
    PORTFOLIO_CATEGORIES,
    PORTFOLIO_CATEGORY_LABELS,
    PortfolioCategory,
    PortfolioItem,
} from "@/lib/content/types";
import {
    clearPortfolioItemCover,
    createPortfolioItem,
    deletePortfolioItem,
    movePortfolioItem,
    setPortfolioItemCover,
    updatePortfolioItem,
} from "@/app/admin/portfolio/actions";

const fieldClass = [
    "mt-1.5 w-full rounded-lg border border-white/15 bg-black/40 px-3.5 py-2.5",
    "text-sm text-white placeholder:text-white/25",
    "outline-none transition-colors",
    "focus:border-cyan-200/60 focus:ring-1 focus:ring-cyan-200/30",
].join(" ");

const labelClass = "block text-xs tracking-[0.16em] text-cyan-100/70";

type EditableFields = { title: string; caption: string; href: string; ready: boolean };
const emptyFields: EditableFields = { title: "", caption: "", href: "", ready: true };

const ItemRow = ({
                     item,
                     isFirst,
                     isLast,
                 }: {
    item: PortfolioItem;
    isFirst: boolean;
    isLast: boolean;
}) => {
    const [fields, setFields] = useState<EditableFields>({
        title: item.title,
        caption: item.caption,
        href: item.href ?? "",
        ready: item.ready,
    });
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);
    const [confirming, setConfirming] = useState(false);

    const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
        setError(null);
        startTransition(async () => {
            const res = await fn();
            if (!res.ok) setError(res.error ?? "処理に失敗しました");
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSavedAt(null);
        setError(null);
        startTransition(async () => {
            const res = await updatePortfolioItem(item.id, fields);
            if (!res.ok) {
                setError(res.error);
                return;
            }
            setSavedAt(Date.now());
        });
    };

    return (
        <Panel className={`p-6 ${pending ? "opacity-60" : ""}`}>
            <div className="flex flex-col gap-5 sm:flex-row">
                <CoverUploader
                    storagePath={`portfolioItems/${item.id}/cover`}
                    coverUrl={item.coverUrl}
                    onUploaded={(url) => setPortfolioItemCover(item.id, url)}
                    onCleared={() => clearPortfolioItemCover(item.id)}
                />

                <form onSubmit={handleSave} className="flex-1 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className={labelClass}>
                            タイトル
                            <input
                                type="text"
                                value={fields.title}
                                onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
                                maxLength={100}
                                required
                                disabled={pending}
                                className={fieldClass}
                            />
                        </label>
                        <label className={labelClass}>
                            リンク先（任意）
                            <input
                                type="text"
                                value={fields.href}
                                onChange={(e) => setFields((f) => ({ ...f, href: e.target.value }))}
                                placeholder="https://..."
                                maxLength={500}
                                disabled={pending}
                                className={fieldClass}
                            />
                        </label>
                    </div>

                    <label className={labelClass}>
                        説明文
                        <input
                            type="text"
                            value={fields.caption}
                            onChange={(e) => setFields((f) => ({ ...f, caption: e.target.value }))}
                            maxLength={300}
                            disabled={pending}
                            className={fieldClass}
                        />
                    </label>

                    <label className="flex items-center gap-2 text-xs text-white/70">
                        <input
                            type="checkbox"
                            checked={fields.ready}
                            onChange={(e) => setFields((f) => ({ ...f, ready: e.target.checked }))}
                            disabled={pending}
                        />
                        公開する（未チェックだと /portfolio に表示されません）
                    </label>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                        <button
                            type="submit"
                            disabled={pending}
                            className="rounded-full border border-cyan-200/30 px-5 py-1.5 text-[11px] tracking-widest text-white transition-shadow hover:shadow-[0_0_18px_rgba(120,255,255,0.3)] disabled:opacity-40"
                        >
                            保存
                        </button>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={pending || isFirst}
                                onClick={() => run(() => movePortfolioItem(item.id, "up"))}
                                className="rounded border border-white/15 px-2.5 py-1 text-white/70 transition-colors hover:border-white/35 hover:text-white disabled:opacity-25"
                                aria-label="上に移動"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                disabled={pending || isLast}
                                onClick={() => run(() => movePortfolioItem(item.id, "down"))}
                                className="rounded border border-white/15 px-2.5 py-1 text-white/70 transition-colors hover:border-white/35 hover:text-white disabled:opacity-25"
                                aria-label="下に移動"
                            >
                                ↓
                            </button>
                        </div>

                        {confirming ? (
                            <span className="ml-auto flex items-center gap-2">
                                <span className="text-[11px] text-rose-300">削除しますか？</span>
                                <button
                                    type="button"
                                    disabled={pending}
                                    onClick={() => run(() => deletePortfolioItem(item.id))}
                                    className="rounded-full border border-rose-400/50 px-4 py-1 text-[11px] text-rose-200 transition-colors hover:bg-rose-400/10"
                                >
                                    削除する
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirming(false)}
                                    className="text-[11px] text-white/50 hover:text-white"
                                >
                                    やめる
                                </button>
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirming(true)}
                                className="ml-auto text-[11px] text-white/35 transition-colors hover:text-rose-300"
                            >
                                削除
                            </button>
                        )}
                    </div>

                    {error && (
                        <p className="text-xs text-rose-300" role="alert">
                            {error}
                        </p>
                    )}
                    {savedAt && !error && (
                        <p className="text-xs text-cyan-200" role="status">
                            保存しました
                        </p>
                    )}
                </form>
            </div>
        </Panel>
    );
};

const NewItemForm = ({ category }: { category: PortfolioCategory }) => {
    const [fields, setFields] = useState<EditableFields>(emptyFields);
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            const res = await createPortfolioItem(category, fields);
            if (!res.ok) {
                setError(res.error);
                return;
            }
            setFields(emptyFields);
            setOpen(false);
        });
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full rounded-2xl border border-dashed border-white/20 py-4 text-xs tracking-widest text-white/50 transition-colors hover:border-cyan-200/40 hover:text-cyan-200"
            >
                + {PORTFOLIO_CATEGORY_LABELS[category].en} に追加
            </button>
        );
    }

    return (
        <Panel className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm tracking-[0.2em] text-white/80">
                    新しい{PORTFOLIO_CATEGORY_LABELS[category].en}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className={labelClass}>
                        タイトル
                        <input
                            type="text"
                            value={fields.title}
                            onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
                            maxLength={100}
                            required
                            disabled={pending}
                            className={fieldClass}
                        />
                    </label>
                    <label className={labelClass}>
                        リンク先（任意）
                        <input
                            type="text"
                            value={fields.href}
                            onChange={(e) => setFields((f) => ({ ...f, href: e.target.value }))}
                            placeholder="https://..."
                            maxLength={500}
                            disabled={pending}
                            className={fieldClass}
                        />
                    </label>
                </div>

                <label className={labelClass}>
                    説明文
                    <input
                        type="text"
                        value={fields.caption}
                        onChange={(e) => setFields((f) => ({ ...f, caption: e.target.value }))}
                        maxLength={300}
                        disabled={pending}
                        className={fieldClass}
                    />
                </label>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={pending}
                        className="rounded-full border border-cyan-200/30 px-6 py-2 text-xs tracking-widest text-white transition-shadow hover:shadow-[0_0_20px_rgba(120,255,255,0.3)] disabled:opacity-40"
                    >
                        {pending ? "追加中..." : "追加する"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="text-xs text-white/50 hover:text-white"
                    >
                        やめる
                    </button>
                    {error && (
                        <p className="text-xs text-rose-300" role="alert">
                            {error}
                        </p>
                    )}
                </div>
            </form>
        </Panel>
    );
};

export const PortfolioItemsManager = ({
                                          items,
                                      }: {
    items: Record<PortfolioCategory, PortfolioItem[]>;
}) => {
    const [category, setCategory] = useState<PortfolioCategory>("sites");
    const list = items[category];

    return (
        <div>
            <div className="mb-6 flex flex-wrap gap-2">
                {PORTFOLIO_CATEGORIES.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-full border px-4 py-1.5 text-xs tracking-widest transition-colors ${
                            category === c
                                ? "border-cyan-200/50 bg-cyan-200/10 text-cyan-200"
                                : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                        }`}
                    >
                        {PORTFOLIO_CATEGORY_LABELS[c].en}
                        <span className="ml-1.5 text-white/35">({items[c].length})</span>
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <NewItemForm category={category} />

                {list.length === 0 ? (
                    <Panel className="p-10 text-center">
                        <p className="text-sm text-white/50">
                            {PORTFOLIO_CATEGORY_LABELS[category].en} にはまだ作品がありません
                        </p>
                    </Panel>
                ) : (
                    list.map((item, index) => (
                        <ItemRow
                            key={item.id}
                            item={item}
                            isFirst={index === 0}
                            isLast={index === list.length - 1}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
