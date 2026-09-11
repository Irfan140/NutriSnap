import { Queue } from "bullmq";
import { env } from "../config/env.config.js";
import type { MealAnalysisJobData, MealQueueJobData } from "../types/meal-analysis.types.js";

export const MEAL_ANALYSIS_QUEUE_NAME = "meal-analysis";

let queue: Queue<MealQueueJobData> | null = null;

export function getMealAnalysisQueue(): Queue<MealQueueJobData> {
  if (!queue) {
    queue = new Queue<MealQueueJobData>(MEAL_ANALYSIS_QUEUE_NAME, {
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

/**
 * Best-effort removal of a queued job (meal deletion / account erasure).
 * Resolves false when the job is already gone or actively processing —
 * the processor treats a missing row as done, so callers can proceed.
 */
export async function removeAnalysisJob(analysisId: string): Promise<boolean> {
  const job = await getMealAnalysisQueue().getJob(analysisId);
  if (!job) return false;
  try {
    await job.remove();
    return true;
  } catch {
    return false;
  }
}
