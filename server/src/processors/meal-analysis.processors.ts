import { UnrecoverableError, type Job } from "bullmq";
import { env } from "../config/env.config.js";
import { downloadObject, headObject, MAX_UPLOAD_BYTES } from "../lib/r2.lib.js";
import {
  findAnalysisById,
  markAnalysisFailed,
  markAnalysisStatus,
  markAnalysisSucceeded,
} from "../repositories/meal-analyses.repositories.js";
import type { MealAnalysisJobData } from "../queues/meal-analysis.queues.js";
import { aiService } from "../services/meal-analysis.services.js";
import { logger } from "../utils/logger.utils.js";

function toUserErrorMessage(status: "invalid-image" | "not-food" | "invalid-ai-response"): string {
  if (status === "not-food") {
    return "The image does not appear to contain food. Please upload a meal image.";
  }
  if (status === "invalid-ai-response") {
    return "AI returned invalid nutrition data. Please try again with a clearer food image.";
  }
  return "The uploaded image could not be read. Please upload again.";
}

/**
 * Background handler for a meal analysis job: downloads the private R2
 * object, runs the (existing) AI analysis, and persists the outcome so the
 * mobile client can poll it. Terminal failures are recorded on the row and
 * raised as UnrecoverableError; transient provider failures are rethrown so
 * BullMQ retries with backoff.
 */
export async function processMealAnalysis(job: Job<MealAnalysisJobData>): Promise<void> {
  const { analysisId, r2Key } = job.data;
  const startedAt = performance.now();

  const row = await findAnalysisById(analysisId);
  if (!row) {
    throw new UnrecoverableError(`MealAnalysis not found: ${analysisId}`);
  }
  if (row.status === "SUCCEEDED") {
    return;
  }

  await markAnalysisStatus(analysisId, "PROCESSING");

  try {
    const head = await headObject(r2Key);
    if (!head) {
      throw new UnrecoverableError("Uploaded image not found. Please upload again.");
    }
    if (head.contentLength > MAX_UPLOAD_BYTES) {
      throw new UnrecoverableError("Uploaded image is too large. Please upload a smaller photo.");
    }

    const bytes = await downloadObject(r2Key);
    const outcome = await aiService.analyzeMeal(bytes.toString("base64"));

    if (outcome.status === "success") {
      const durationMs = Math.round(performance.now() - startedAt);
      await markAnalysisSucceeded(analysisId, {
        nutrition: outcome.analysis.nutrition,
        healthScore: outcome.analysis.nutrition["Health Score"],
        healthAdvice: outcome.analysis.healthAdvice,
        alternativeSuggestions: outcome.analysis.alternativeSuggestions,
        summary: outcome.analysis.summary,
        message: outcome.message,
        model: env.OPENAI_VISION_MODEL,
        durationMs,
      });
      logger.info({ analysisId, durationMs }, "Meal analysis job completed");
      return;
    }

    if (outcome.status === "provider-failure") {
      throw new Error("AI provider temporarily unavailable");
    }

    await markAnalysisFailed(analysisId, toUserErrorMessage(outcome.status));
  } catch (error) {
    if (error instanceof UnrecoverableError) {
      try {
        await markAnalysisFailed(analysisId, error.message);
      } catch (markError) {
        logger.error({ err: markError, analysisId }, "Failed to record terminal job failure");
      }
    }
    throw error;
  }
}
