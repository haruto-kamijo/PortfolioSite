// src/app/admin/analytics/page.tsx

import type { Metadata } from "next";

import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { ANALYTICS_PERIODS, AnalyticsRow, getAnalyticsSummary, isAnalyticsPeriod } from "@/lib/admin/analytics";
import { getKnownTargets } from "@/lib/analytics/known";
import { CATALOG_CONCEPTS, isCatalogConceptId } from "@/lib/catalog/concepts";
import { CATALOG_PARTS, CatalogPartId } from "@/lib/catalog/parts";
import { analytics } from "@/lib/site";

/** 認証を通った後にだけ描画されるため、ここでタイトルを付けても存在は漏れない */
export const metadata: Metadata = {
    title: "アクセス解析",
    robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const WIDTH_NAMES: Record<string, string> = { fit: "合わせる", pc: "PC", tablet: "タブレット", phone: "スマホ" };

const conceptName = (id: string) => (isCatalogConceptId(id) ? CATALOG_CONCEPTS[id].name.ja : id);

/** カタログの操作の対象（width:kissa:pc など）を、読める名前にする */
const catalogLabel = (key: string) => {
    const [action, a, b] = key.split(":");
    if (action === "width") return `幅の切り替え：${conceptName(a)} → ${WIDTH_NAMES[b] ?? b}`;
    if (action === "parts") return `パーツの名前を見る：${conceptName(a)}`;
    if (action === "copy") return `コードのコピー：${CATALOG_PARTS[a as CatalogPartId]?.name.ja ?? a}`;
    return key;
};

const Table = ({ title, rows, label }: { title: string; rows: AnalyticsRow[]; label?: (key: string) => string }) => {
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    return (
        <Panel as="section" className="p-6">
            <h2 className="mb-4 flex items-baseline gap-3 text-sm text-white">
                {title}
                <span className="text-xs text-white/40">計 {total} 回</span>
            </h2>
            {rows.length === 0 ? (
                <p className="text-xs text-white/40">この期間はありません</p>
            ) : (
                <table className="w-full text-left text-xs">
                    <thead className="sr-only">
                        <tr>
                            <th scope="col">対象</th>
                            <th scope="col">回数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.key} className="border-t border-white/5">
                                <td className="break-all py-2 pr-4 text-white/80">{label ? label(r.key) : r.key}</td>
                                <td className="py-2 text-right tabular-nums text-cyan-200">{r.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Panel>
    );
};

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: { days?: string } }) {
    const requested = Number(searchParams.days);
    const days = isAnalyticsPeriod(requested) ? requested : 30;
    // タグは小文字にして数えているので、作品に付いている書き方に戻して出す
    const [summary, known] = await Promise.all([getAnalyticsSummary(days), getKnownTargets().catch(() => null)]);
    const tagLabel = (key: string) => known?.tags.get(key) ?? key;

    return (
        <div className="mx-auto max-w-5xl px-5 py-10">
            <div className="mb-6 flex flex-wrap items-baseline gap-4">
                <h1 className="text-lg tracking-[0.24em] text-white">アクセス解析</h1>
                <p className="text-xs text-white/40">
                    {summary.from} 〜 {summary.to}（日本時間）
                </p>
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-4">
                <nav aria-label="期間" className="flex rounded-full border border-white/15 p-0.5 text-xs">
                    {ANALYTICS_PERIODS.map((d) => (
                        <Link
                            key={d}
                            href={`/admin/analytics?days=${d}`}
                            aria-current={d === days ? "page" : undefined}
                            className={`rounded-full px-3 py-1.5 transition-colors ${
                                d === days ? "bg-cyan-200/15 text-cyan-200" : "text-white/60 hover:text-white"
                            }`}
                        >
                            直近 {d} 日
                        </Link>
                    ))}
                </nav>
                <a
                    href={analytics.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-200/80 hover:text-cyan-200"
                >
                    ページの閲覧数（Cloudflare）↗
                </a>
            </div>

            {summary.unavailable && (
                <Panel className="mb-8 p-6">
                    <p className="text-xs leading-relaxed text-amber-200/80">Firestore を読めなかったため、回数を出せません。</p>
                </Panel>
            )}

            <div className="grid gap-4">
                <Panel as="section" className="p-6">
                    <h2 className="text-sm text-white">問い合わせの送信</h2>
                    <p className="mt-4 text-2xl text-cyan-200">
                        {summary.contacts}
                        <span className="ml-2 text-xs text-white/40">件</span>
                    </p>
                </Panel>
                <Table title="外へのリンク" rows={summary.counts.external} />
                <Table title="タグでの絞り込み" rows={summary.counts.tag} label={tagLabel} />
                <Table title="デザインカタログの操作" rows={summary.counts.catalog} label={catalogLabel} />
            </div>
        </div>
    );
}
