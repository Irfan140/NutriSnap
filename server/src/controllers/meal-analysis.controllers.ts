import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { env } from "../config/env.config.js";
import {
  buildMealImageKey,
  createDownloadUrl,
  createUploadUrl,
  headObject,
  isR2Configured,
  isUserImageKey,
  MAX_UPLOAD_BYTES,
} from "../lib/r2.lib.js";
import {
  createQueuedAnalysis,
  findUserAnalysis,
} from "../repositories/meal-analyses.repositories.js";
import { enqueueMealAnalysis } from "../queues/meal-analysis.queues.js";
import { enqueueMealAnalysisSchema, mealAnalysisParamsSchema } from "../schemas/meal.schemas.js";
import { ensureUser } from "../services/clerk-sync.services.js";
import { logger } from "../utils/logger.utils.js";
import type { AnalyzeMealResponse, MealAnalysisDeps } from "../types/meal-analysis.types.js";

type ErrorResponse = {
  readonly error: string;
};

type EnqueueResponseBody = { readonly analysisId: string; readonly status: string };

type AnalysisResponseBody =
  | ({ readonly analysisId: string; readonly status: string } & Partial<
      AnalyzeMealResponse & { readonly error: string; readonly imageUrl: string }
    >)
  | ErrorResponse;

type PresignResponseBody =
  | { readonly key: string; readonly uploadUrl: string; readonly expiresInSec: number }
  | ErrorResponse;

const defaultDeps: MealAnalysisDeps = {
  ensureUser,
  createQueuedAnalysis,
  findUserAnalysis,
  enqueueMealAnalysis,
};

function unauthorized(): { status: 401; body: ErrorResponse } {
  return { status: 401, body: { error: "Unauthorized: missing or invalid session token." } };
}

export function createAiController(deps: MealAnalysisDeps = defaultDeps) {
  /**
   * Issues a short-lived presigned PUT URL so mobile uploads the meal photo
   * straight to the private R2 bucket. No image bytes flow through the API.
   */
  const requestUpload: RequestHandler<ParamsDictionary, PresignResponseBody> = async (
    req,
    res,
  ): Promise<void> => {
    const clerkId = req.auth?.userId;
    if (!clerkId) {
      const { status, body } = unauthorized();
      res.status(status).json(body);
      return;
    }
    if (!isR2Configured()) {
      res.status(503).json({ error: "Image uploads are temporarily unavailable." });
      return;
    }

    const user = await deps.ensureUser(clerkId);
    const key = buildMealImageKey(user.id);
    const { uploadUrl, expiresInSec } = await createUploadUrl(key);
    res.status(200).json({ key, uploadUrl, expiresInSec });
  };

  /**
   * Accepts an R2 key the client already uploaded, verifies it exists and
   * belongs to the caller, persists a QUEUED row, and hands the work to the
   * background worker. Returns 202 immediately — poll GET /api/aifood/:id.
   */
  const enqueueAnalysis: RequestHandler<
    ParamsDictionary,
    EnqueueResponseBody | ErrorResponse
  > = async (req, res): Promise<void> => {
    const parsedBody = enqueueMealAnalysisSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res
        .status(400)
        .json({ error: parsedBody.error.issues[0]?.message ?? "Invalid request body" });
      return;
    }

    const clerkId = req.auth?.userId;
    if (!clerkId) {
      const { status, body } = unauthorized();
      res.status(status).json(body);
      return;
    }
    if (!isR2Configured()) {
      res.status(503).json({ error: "Meal analysis is temporarily unavailable." });
      return;
    }

    const user = await deps.ensureUser(clerkId);
    const imageKey = parsedBody.data.imageKey;
    if (!isUserImageKey(imageKey, user.id)) {
      res.status(422).json({ error: "Invalid image key. Please upload the photo first." });
      return;
    }

    const head = await headObject(imageKey);
    if (!head) {
      res.status(422).json({ error: "Uploaded image not found. Please upload the photo first." });
      return;
    }
    if (head.contentLength > MAX_UPLOAD_BYTES) {
      res
        .status(422)
        .json({ error: "Uploaded image is too large. Please upload a smaller photo." });
      return;
    }

    const row = await deps.createQueuedAnalysis(user.id, imageKey, env.OPENAI_VISION_MODEL);
    await deps.enqueueMealAnalysis({ analysisId: row.id, r2Key: imageKey });
    res.status(202).json({ analysisId: row.id, status: row.status });
  };

  /** Poll endpoint: status plus the formatted result once SUCCEEDED. */
  const getAnalysis: RequestHandler<ParamsDictionary, AnalysisResponseBody> = async (
    req,
    res,
  ): Promise<void> => {
    const parsedParams = mealAnalysisParamsSchema.safeParse(req.params);
    if (!parsedParams.success) {
      res.status(400).json({ error: parsedParams.error.issues[0]?.message ?? "Invalid request" });
      return;
    }

    const clerkId = req.auth?.userId;
    if (!clerkId) {
      const { status, body } = unauthorized();
      res.status(status).json(body);
      return;
    }

    const user = await deps.ensureUser(clerkId);
    const row = await deps.findUserAnalysis(parsedParams.data.id, user.id);
    if (!row) {
      res.status(404).json({ error: "Analysis not found." });
      return;
    }

    let imageUrl: string | undefined;
    if (isR2Configured()) {
      try {
        imageUrl = (await createDownloadUrl(row.r2Key)).downloadUrl;
      } catch (error) {
        logger.warn({ err: error, analysisId: row.id }, "Failed to presign image view URL");
      }
    }

    if (row.status === "FAILED") {
      res.status(422).json({
        analysisId: row.id,
        status: row.status,
        error: row.error ?? "Analysis failed. Please try again.",
        ...(imageUrl ? { imageUrl } : {}),
      });
      return;
    }

    if (row.status !== "SUCCEEDED") {
      res.status(200).json({ analysisId: row.id, status: row.status });
      return;
    }

    res.status(200).json({
      analysisId: row.id,
      status: row.status,
      message: row.message ?? "",
      ...(imageUrl ? { imageUrl } : {}),
    });
  };

  return { requestUpload, enqueueAnalysis, getAnalysis };
}
