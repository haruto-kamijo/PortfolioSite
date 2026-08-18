// src/lib/academicYear.ts

/**
 * 学年表記を年度から自動計算する。
 *
 * 日本の学年度は4月始まりなので、1〜3月は前年の年度として扱う。
 * 「2026年度に M1」という基準だけを持ち、そこから年度差で学年を進める。
 * 進学予定が変わったら GRADE_LADDER を編集するだけでよい。
 */

/** 基準となる年度と、その年度の学年 */
const ANCHOR = { fiscalYear: 2026, grade: "M1" } as const;

/** 想定している在学の道筋。末尾を超えたら修了扱いになる */
export const GRADE_LADDER = ["M1", "M2", "D1", "D2", "D3"] as const;

export type Grade = (typeof GRADE_LADDER)[number];

/** その日付が属する日本の年度（4月1日始まり） */
export const fiscalYearOf = (date: Date): number =>
    date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;

export type AcademicStatus = {
    /** 在学中なら学年、ラダーを終えていれば null */
    grade: Grade | null;
    fiscalYear: number;
    graduated: boolean;
};

export const academicStatusAt = (date: Date): AcademicStatus => {
    const fiscalYear = fiscalYearOf(date);
    const anchorIndex = GRADE_LADDER.indexOf(ANCHOR.grade);
    const index = anchorIndex + (fiscalYear - ANCHOR.fiscalYear);

    // 基準より前の年度は基準の学年で止める（過去は表示対象ではないため）
    const clamped = Math.max(0, index);
    const grade = GRADE_LADDER[clamped] ?? null;

    return { grade, fiscalYear, graduated: grade === null };
};
