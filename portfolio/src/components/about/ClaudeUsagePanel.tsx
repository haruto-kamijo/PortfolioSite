// src/components/about/ClaudeUsagePanel.tsx
import type { ReactNode } from "react";
import { Panel } from "@/components/ui/Panel";
import { ClaudeUsage, addDays, dateOf, todayInTokyo } from "@/lib/content/claudeUsage";
import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

type Texts = Dictionary["about"]["usage"];

/** ヒートマップの濃さ（0 は使っていない日）。星空の背景に合わせて水色の濃淡にする */
const LEVEL_FILLS = [
    "rgba(255,255,255,0.06)",
    "rgba(103,232,249,0.25)",
    "rgba(103,232,249,0.45)",
    "rgba(103,232,249,0.7)",
    "rgba(165,243,252,0.95)",
];

const CELL = 10;
const STEP = 12;
const TOP = 14;

/** 使った日のトークン数を 4 段階に分ける境目（使った日の中での四分位） */
const thresholdsOf = (values: number[]): [number, number, number] => {
    const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
    if (sorted.length === 0) return [0, 0, 0];
    const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
    return [q(0.25), q(0.5), q(0.75)];
};

const levelOf = (v: number, [q1, q2, q3]: [number, number, number]) => {
    if (v <= 0) return 0;
    if (v <= q1) return 1;
    if (v <= q2) return 2;
    if (v <= q3) return 3;
    return 4;
};

const Heatmap = ({
    weeks,
    today,
    tokensByDay,
    lang,
    texts,
    className,
}: {
    weeks: number;
    today: string;
    tokensByDay: Map<string, number>;
    lang: Locale;
    texts: Texts;
    className: string;
}) => {
    // 右端の列に今日が入るよう、今日の週の日曜日から weeks - 1 週さかのぼって始める
    const start = addDays(today, -dateOf(today).getUTCDay() - (weeks - 1) * 7);
    const thresholds = thresholdsOf(
        Array.from({ length: weeks * 7 }, (_, i) => tokensByDay.get(addDays(start, i)) ?? 0)
    );
    const monthFmt = new Intl.DateTimeFormat(lang, { month: "short", timeZone: "UTC" });
    const dayFmt = new Intl.DateTimeFormat(lang, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
    const numFmt = new Intl.NumberFormat(lang);

    // ツールチップを見られない読み上げ環境向けに、期間・使った日数・最も多かった日を要約して渡す
    const inRange = Array.from(tokensByDay).filter(([d]) => d >= start && d <= today);
    const busiest = inRange.reduce<[string, number] | null>((best, cur) => (!best || cur[1] > best[1] ? cur : best), null);
    const summary = texts.heatmapLabel
        .replace("{from}", dayFmt.format(dateOf(start)))
        .replace("{to}", dayFmt.format(dateOf(today)))
        .replace("{days}", numFmt.format(inRange.filter(([, t]) => t > 0).length))
        .replace("{busiest}", busiest ? `${dayFmt.format(dateOf(busiest[0]))} (${numFmt.format(busiest[1])} ${texts.tokensUnit})` : "-");

    // 月名は、月の 1 日を含む列に出す。左端の列には始まりの月を出すが、
    // 次の月名とぶつかる（次の月の 1 日が 3 列目より手前にある）ときは次の月を優先して出さない。
    // 右端の 1 列に始まる月は、図の外にはみ出すので出さない
    const labelCols: { col: number; date: Date }[] = [];
    for (let col = 0; col < weeks - 1; col++) {
        for (let row = 0; row < 7; row++) {
            const ymd = addDays(start, col * 7 + row);
            if (ymd > today) break;
            if (dateOf(ymd).getUTCDate() === 1) labelCols.push({ col, date: dateOf(ymd) });
        }
    }
    if (labelCols[0]?.col !== 0 && (labelCols[0]?.col ?? weeks) >= 3) labelCols.unshift({ col: 0, date: dateOf(start) });
    const labels = labelCols.map(({ col, date }) => (
        <text key={col} x={col * STEP} y={9} fontSize={9} fill="rgba(203,213,225,0.7)">
            {monthFmt.format(date)}
        </text>
    ));

    const cells: ReactNode[] = [];
    for (let col = 0; col < weeks; col++) {
        for (let row = 0; row < 7; row++) {
            const ymd = addDays(start, col * 7 + row);
            if (ymd > today) break;
            const date = dateOf(ymd);
            const tokens = tokensByDay.get(ymd) ?? 0;
            cells.push(
                <rect
                    key={ymd}
                    x={col * STEP}
                    y={TOP + row * STEP}
                    width={CELL}
                    height={CELL}
                    rx={2}
                    fill={LEVEL_FILLS[levelOf(tokens, thresholds)]}
                >
                    <title>{`${dayFmt.format(date)}: ${tokens > 0 ? `${numFmt.format(tokens)} ${texts.tokensUnit}` : texts.noActivity}`}</title>
                </rect>
            );
        }
    }

    return (
        <svg
            viewBox={`0 0 ${weeks * STEP - (STEP - CELL)} ${TOP + 7 * STEP - (STEP - CELL)}`}
            className={className}
            role="img"
            aria-label={summary}
        >
            {labels}
            {cells}
        </svg>
    );
};

const Stat = ({ value, label }: { value: string; label: string }) => (
    <div>
        <p className="text-lg text-white sm:text-xl">{value}</p>
        <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
);

/** About ページの「Claude Code の利用状況」。GitHub の草のような日別ヒートマップと合計値 */
export const ClaudeUsagePanel = ({ usage, lang, texts }: { usage: ClaudeUsage; lang: Locale; texts: Texts }) => {
    // 集計が止まっている（PC を起動していない日が続いた）ときに「直近 7 日」が 0 にならないよう、
    // 最後に集計した日を基準にする。何日時点の値かは右上に出す
    const updatedDay = todayInTokyo(new Date(usage.updatedAt));
    const today = [todayInTokyo(), updatedDay].sort()[0];
    const tokensByDay = new Map(usage.days.map((d) => [d.d, d.t]));
    const sumSince = (from: string) => usage.days.filter((d) => d.d >= from && d.d <= today).reduce((n, d) => n + d.t, 0);

    const compact = new Intl.NumberFormat(lang, { notation: "compact", maximumSignificantDigits: 3 });
    const plain = new Intl.NumberFormat(lang);
    const dateFmt = new Intl.DateTimeFormat(lang, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

    return (
        <Panel className="p-6 sm:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm tracking-[0.24em] text-cyan-200/80">{texts.title}</p>
                <p className="text-xs text-slate-500">
                    {texts.since
                        .replace("{date}", dateFmt.format(dateOf(usage.totals.firstDay)))
                        .replace("{updated}", dateFmt.format(dateOf(updatedDay)))}
                </p>
            </div>

            <div className="mt-4">
                {/* 狭い画面では半年分、md 以上では 1 年分を出す（sm 幅で 1 年分にすると文字が小さくなりすぎる） */}
                <Heatmap weeks={26} today={today} tokensByDay={tokensByDay} lang={lang} texts={texts} className="w-full md:hidden" />
                <Heatmap weeks={53} today={today} tokensByDay={tokensByDay} lang={lang} texts={texts} className="hidden w-full md:block" />
                <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500" aria-hidden>
                    <span className="mr-1">{texts.less}</span>
                    {LEVEL_FILLS.map((fill) => (
                        <span key={fill} className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: fill }} />
                    ))}
                    <span className="ml-1">{texts.more}</span>
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
                <Stat value={plain.format(usage.totals.activeDays)} label={texts.activeDays} />
                <Stat value={plain.format(usage.totals.sessions)} label={texts.sessions} />
                <Stat value={compact.format(usage.totals.outputTokens)} label={texts.outputTokens} />
                <Stat value={compact.format(sumSince(`${today.slice(0, 7)}-01`))} label={texts.thisMonth} />
                <Stat value={compact.format(sumSince(addDays(today, -6)))} label={texts.last7Days} />
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{texts.note}</p>
        </Panel>
    );
};
