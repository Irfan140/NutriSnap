import type { MealAnalysis, MealAnalysisStatus } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.lib.js";
import type {
  MealHistoryItem,
  SucceededAnalysisInput,
  UserMealStats,
} from "../types/meal-analysis.types.js";

export async function createQueuedAnalysis(
  userId: string,
  r2Key: string,
  model: string,
): Promise<MealAnalysis> {
  return prisma.mealAnalysis.create({
    data: { userId, r2Key, model, status: "QUEUED" },
  });
}

/** Loads an analysis only if it belongs to the given user (ownership check). */
export async function findUserAnalysis(id: string, userId: string): Promise<MealAnalysis | null> {
  return prisma.mealAnalysis.findFirst({ where: { id, userId } });
}

export async function findAnalysisById(id: string): Promise<MealAnalysis | null> {
  return prisma.mealAnalysis.findUnique({ where: { id } });
}

/**
 * Newest-first page of the caller's own analyses (meal history).
 * Offset pagination is a deliberate v1 choice: personal history has a low
 * write rate, so drift risk is negligible; upgrade to keyset if it matters.
 */
export async function listUserAnalyses(
  userId: string,
  page: number,
  limit: number,
): Promise<{ items: MealHistoryItem[]; total: number }> {
  const skip = (page - 1) * limit;
  const [items, total] = await prisma.$transaction([
    prisma.mealAnalysis.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        healthScore: true,
        summary: true,
        error: true,
        r2Key: true,
        createdAt: true,
        completedAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.mealAnalysis.count({ where: { userId } }),
  ]);
  return { items, total };
}

const DAY_MS = 86_400_000;

function toUtcDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS,
  );
}

/**
 * Current run (ending today or yesterday) and longest-ever run of
 * consecutive UTC days with at least one succeeded analysis.
 */
function computeStreaks(dayNumbers: readonly number[]): {
  currentStreak: number;
  bestStreak: number;
} {
  const days = [...new Set(dayNumbers)].sort((a, b) => b - a);
  const latest = days[0];
  if (latest === undefined) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  let bestStreak = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1];
    const curr = days[i];
    if (prev === undefined || curr === undefined) break;
    if (prev - curr === 1) {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 1;
    }
  }

  const today = toUtcDayNumber(new Date());
  let currentStreak = 0;
  if (latest === today || latest === today - 1) {
    currentStreak = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = days[i - 1];
      const curr = days[i];
      if (prev === undefined || curr === undefined) break;
      if (prev - curr === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return { currentStreak, bestStreak };
}

/**
 * Profile stats for one user. Single transaction; the day list is
 * dates-only over an indexed filter, so it stays cheap for years of meals.
 */
export async function getUserMealStats(userId: string): Promise<UserMealStats> {
  const [total, succeeded, failed, aggregate, rows] = await prisma.$transaction([
    prisma.mealAnalysis.count({ where: { userId } }),
    prisma.mealAnalysis.count({ where: { userId, status: "SUCCEEDED" } }),
    prisma.mealAnalysis.count({ where: { userId, status: "FAILED" } }),
    prisma.mealAnalysis.aggregate({
      where: { userId, status: "SUCCEEDED" },
      _avg: { healthScore: true },
      _max: { createdAt: true },
    }),
    prisma.mealAnalysis.findMany({
      where: { userId, status: "SUCCEEDED" },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const averageHealthScore =
    aggregate._avg.healthScore === null ? null : Math.round(aggregate._avg.healthScore * 10) / 10;
  const { currentStreak, bestStreak } = computeStreaks(
    rows.map((row) => toUtcDayNumber(row.createdAt)),
  );

  return {
    total,
    succeeded,
    failed,
    averageHealthScore,
    currentStreak,
    bestStreak,
    lastAnalyzedAt: aggregate._max.createdAt,
  };
}

export async function markAnalysisStatus(id: string, status: MealAnalysisStatus): Promise<void> {
  await prisma.mealAnalysis.update({ where: { id }, data: { status } });
}

export async function markAnalysisSucceeded(
  id: string,
  input: SucceededAnalysisInput,
): Promise<MealAnalysis> {
  return prisma.mealAnalysis.update({
    where: { id },
    data: {
      status: "SUCCEEDED",
      nutrition: input.nutrition,
      healthScore: input.healthScore,
      healthAdvice: [...input.healthAdvice],
      alternativeSuggestions: [...input.alternativeSuggestions],
      summary: input.summary,
      message: input.message,
      model: input.model,
      durationMs: input.durationMs,
      completedAt: new Date(),
    },
  });
}

export async function markAnalysisFailed(id: string, error: string): Promise<void> {
  await prisma.mealAnalysis.update({
    where: { id },
    data: { status: "FAILED", error, completedAt: new Date() },
  });
}
