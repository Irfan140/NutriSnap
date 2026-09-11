import { Worker, type Job } from "bullmq";
import { env } from "../config/env.config.js";
import { prisma } from "../lib/prisma.lib.js";
import { processMealAnalysis } from "../processors/meal-analysis.processors.js";
import {
  SWEEP_ORPHANS_JOB_NAME,
  SWEEP_STALLED_JOB_NAME,
  sweepOrphanUploads,
  sweepStalledAnalyses,
} from "../processors/maintenance.processors.js";
import {
  closeMealAnalysisQueue,
  getMealAnalysisQueue,
  MEAL_ANALYSIS_QUEUE_NAME,
} from "../queues/meal-analysis.queues.js";
import type { MealAnalysisJobData, MealQueueJobData } from "../types/meal-analysis.types.js";
import { logger } from "../utils/logger.utils.js";

const CONCURRENCY = 3;

const worker = new Worker<MealQueueJobData>(
  MEAL_ANALYSIS_QUEUE_NAME,
  async (job) => {
    if (job.name === SWEEP_STALLED_JOB_NAME) {
      await sweepStalledAnalyses();
      return;
    }
    if (job.name === SWEEP_ORPHANS_JOB_NAME) {
      await sweepOrphanUploads();
      return;
    }
    // Remaining jobs are analyses; BullMQ data is runtime-dynamic.
    await processMealAnalysis(job as Job<MealAnalysisJobData>);
  },
  {
    connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
    concurrency: CONCURRENCY,
  },
);

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

async function scheduleSweeps(): Promise<void> {
  const queue = getMealAnalysisQueue();
  // BullMQ v6 job schedulers (upsert = idempotent across restarts).
  await queue.upsertJobScheduler(
    SWEEP_STALLED_JOB_NAME,
    { every: 15 * 60_000 },
    {
      name: SWEEP_STALLED_JOB_NAME,
      data: {},
      opts: { removeOnComplete: 10, removeOnFail: 20 },
    },
  );
  await queue.upsertJobScheduler(
    SWEEP_ORPHANS_JOB_NAME,
    { every: 24 * 3_600_000 },
    {
      name: SWEEP_ORPHANS_JOB_NAME,
      data: {},
      opts: { removeOnComplete: 10, removeOnFail: 20 },
    },
  );
  logger.info("Maintenance sweeps scheduled (stalled 15m, orphans 24h)");
}

void scheduleSweeps().catch((err: unknown) => {
  logger.error({ err }, "Failed to schedule maintenance sweeps");
});

logger.info(
  { queue: MEAL_ANALYSIS_QUEUE_NAME, concurrency: CONCURRENCY },
  "Meal analysis worker started",
);
