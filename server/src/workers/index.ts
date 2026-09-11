import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { processMealAnalysis } from "../processors/meal-analysis.processor.js";
import {
  closeMealAnalysisQueue,
  MEAL_ANALYSIS_QUEUE_NAME,
  type MealAnalysisJobData,
} from "../queues/meal-analysis.queue.js";
import { logger } from "../utils/logger.js";

const CONCURRENCY = 3;

const worker = new Worker<MealAnalysisJobData>(MEAL_ANALYSIS_QUEUE_NAME, processMealAnalysis, {
  connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
  concurrency: CONCURRENCY,
});

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Meal analysis job completed");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Meal analysis job failed");
});

worker.on("error", (err) => {
  logger.error({ err }, "Meal analysis worker error");
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Meal analysis worker shutting down…");
  await worker.close();
  await closeMealAnalysisQueue();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

logger.info(
  { queue: MEAL_ANALYSIS_QUEUE_NAME, concurrency: CONCURRENCY },
  "Meal analysis worker started",
);
