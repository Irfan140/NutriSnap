import type { MealAnalysis, MealAnalysisStatus } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.lib.js";
import type { SucceededAnalysisInput } from "../types/meal-analysis.types.js";

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
