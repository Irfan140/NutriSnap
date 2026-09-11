import { Queue } from "bullmq";
import { env } from "../config/env.config.js";
import type { MealAnalysisJobData } from "../types/meal-analysis.types.js";

export const MEAL_ANALYSIS_QUEUE_NAME = "meal-analysis";

let queue: Queue<MealAnalysisJobData> | null = null;

export function getMealAnalysisQueue(): Queue<MealAnalysisJobData> {
  if (!queue) {
    queue = new Queue<MealAnalysisJobData>(MEAL_ANALYSIS_QUEUE_NAME, {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    });
  }
  return queue;
}

/**
 * Enqueues a meal analysis job. The BullMQ job id equals the MealAnalysis
 * row id so re-enqueues are idempotent and polling is a simple DB read.
 */
export async function enqueueMealAnalysis(data: MealAnalysisJobData): Promise<string> {
  const job = await getMealAnalysisQueue().add("analyze", data, {
    jobId: data.analysisId,
    attempts: 2,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
  return job.id ?? data.analysisId;
}

export async function closeMealAnalysisQueue(): Promise<void> {
  await queue?.close();
  queue = null;
}
