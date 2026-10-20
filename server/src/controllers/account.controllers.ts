import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { deleteObjects, isR2Configured } from "../lib/r2.lib.js";
import { deleteUserById } from "../repositories/users.repositories.js";
import { findAllUserAnalysisKeys } from "../repositories/meal-analyses.repositories.js";
import { removeAnalysisJob } from "../queues/meal-analysis.queues.js";
import { logger } from "../utils/logger.utils.js";

type ErrorResponse = {
  readonly error: string;
};

export type AccountDeps = {
  readonly findAllUserAnalysisKeys: typeof findAllUserAnalysisKeys;
  readonly removeAnalysisJob: typeof removeAnalysisJob;
  readonly deleteObjects: typeof deleteObjects;
  readonly deleteUserById: typeof deleteUserById;
};

const defaultDeps: AccountDeps = {
  findAllUserAnalysisKeys,
  removeAnalysisJob,
  deleteObjects,
  deleteUserById,
};

export function createAccountController(deps: AccountDeps = defaultDeps) {
  /**
   * Full self-serve erasure, data-first so a failure never strands data
   * without an owner: drop queued jobs → delete private R2 objects
   * (best-effort; the orphan sweeper backstops) → delete the Better Auth
   * user row last (cascades sessions, accounts, and meal analyses).
   */
  const deleteAccount: RequestHandler<ParamsDictionary, ErrorResponse> = async (
    req,
    res,
  ): Promise<void> => {
    const userId = req.auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized: missing or invalid session token." });
      return;
    }

    const analyses = await deps.findAllUserAnalysisKeys(userId);

    await Promise.all(analyses.map((analysis) => deps.removeAnalysisJob(analysis.id)));

    if (isR2Configured()) {
      try {
        await deps.deleteObjects(analyses.map((analysis) => analysis.r2Key));
      } catch (error) {
        logger.warn(
          { err: error, userId },
          "Failed to delete some R2 objects during account erasure",
        );
      }
    }

    await deps.deleteUserById(userId);

    res.status(204).end();
  };

  return { deleteAccount };
}
